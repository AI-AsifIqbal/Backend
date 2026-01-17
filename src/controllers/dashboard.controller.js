import mongoose, { isValidObjectId } from "mongoose";
import { Video } from "../models/video.model.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Subscription } from "../models/subscription.model.js"

const getChannelStats = asyncHandler(async (req, res) => {
    const channelId = new mongoose.Types.ObjectId(req.user._id)

    const stats = await Video.aggregate([
        {
            $match: {
                owner: channelId,
                isPublished: true
            }
        },
        {
            $group: {
                _id: null,
                totalVideos: {
                    $sum: 1
                },
                totalViews: {
                    $sum: "$views"
                }
            }
        }
    ])

    const subscribersCount = await Subscription.countDocuments({
        channel: channelId
    })

    return res.status(200).json(
        new ApiResponse(
            200,
            {
                totalVideos: stats[0]?.totalVideos || 0,
                totalViews: stats[0]?.totalViews || 0,
                totalSubscribers: subscribersCount
            },
            "Channel stats fetched successfully"
        )
    )
})

const getChannelVideos = asyncHandler(async (req, res) => {
    const channelId = req.user?._id
    const { page = 1, limit = 10 } = req.query
    
    if (!isValidObjectId(channelId)) {
        throw new ApiError(400, "Invalid user ID")
    }

    const allVideos = Video.aggregate([
        {
            $match: {
                owner: new mongoose.Types.ObjectId(channelId)
            }
        },
        {
            $sort: {
                createdAt: -1
            }
        },
        {
            $project: {
                thumbnail: 1,
                title: 1,
                description: 1,
                duration: 1,
                views: 1,
                isPublished: 1,
                createdAt: 1
            }
        }
    ])

    const videos = await Video.aggregatePaginate(allVideos, {
        page: Number(page),
        limit: Number(limit)
    })

    return res.status(200).json(
        new ApiResponse(200, videos, "Channel videos fetched successfully")
    )
})

export {
    getChannelStats,
    getChannelVideos
}