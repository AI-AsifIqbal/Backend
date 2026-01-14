import { isValidObjectId } from "mongoose";
import { Tweet } from "../models/tweet.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const getAllTweets = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10 } = req.query;

    const allTweets = Tweet.aggregate([
        {
            $lookup: {
                from: "users",
                localField: "owner",
                foreignField: "_id",
                as: "owner",
                pipeline: [
                    {
                        $project: {
                            username: 1,
                            avatar: 1
                        }
                    }
                ]
            }
        },
        {
            $unwind: "$owner"
        },
        {
            $sort: {
                createdAt: -1
            }
        }
    ])

    const tweets = await Tweet.aggregatePaginate(allTweets, {
        page: Number(page),
        limit: Number(limit)
    })

    return res.status(200).json(
        new ApiResponse(200, tweets, "All tweets are fetched")
    )
})

const createTweet = asyncHandler(async (req, res) => {
    const { content } = req.body

    if (!content) {
        throw new ApiError(400, "Tweet cannot be empty")
    }

    const tweet = await Tweet.create({
        content,
        owner: req.user?._id
    })

    return res.status(201).json(
        new ApiResponse(201, tweet, "Tweet is created successfully")
    )
})

const updateTweet = asyncHandler(async (req, res) => {
    const { tweetId } = req.params
    const { content } = req.body

    if (!isValidObjectId(tweetId)) {
        throw new ApiError(404, "Invalid tweet ID")
    }

    if (!content) {
        throw new ApiError(400, "Tweet cannot be empty")
    }

    const tweet = await Tweet.findById(tweetId)

    if (!tweet) {
        throw new ApiError(404, "Tweet not found");
    }

    if (tweet.owner.toString() !== req.user?._id.toString()) {
        throw new ApiError(403, "You have no access to update this tweet");
    }

    tweet.content = content
    await tweet.save()

    return res.status(200).json(
        new ApiResponse(200, tweet, "Tweet is updated successfully")
    )
})

const deleteTweet = asyncHandler(async (req, res) => {
    const { tweetId } = req.params
    
    if (!isValidObjectId(tweetId)) {
        throw new ApiError(404, "Invalid tweet ID")
    }

    const tweet = await Tweet.findById(tweetId)

    if (!tweet) {
        throw new ApiError(404, "Tweet not found");
    }

    if (tweet.owner.toString() !== req.user?._id.toString()) {
        throw new ApiError(403, "You have no access to delete this tweet");
    }

    await Tweet.findByIdAndDelete(tweetId)

    return res.status(200).json(
        new ApiResponse(200, {}, "Tweet is deleted successfully")
    )
})

export {
    getAllTweets,
    createTweet,
    updateTweet,
    deleteTweet
}