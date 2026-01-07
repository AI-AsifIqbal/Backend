import mongoose from "mongoose"
import { Subscription } from "../models/subscription.model.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"

const toggleSubscription = asyncHandler(async (req, res) => {
    const { channelId } = req.params
    const subscriberId = req.user?._id
    
    if (!channelId) {
        throw new ApiError(400, "No channel selected")
    }

    if (!subscriberId) {
        throw new ApiError(401, "Login required to subscribe");
    }

    if (channelId === subscriberId.toString()) {
        throw new ApiError(400, "You cannot subscribe your own channel")
    }

    const existingSubscription = await Subscription.findOne({
        subscriber: subscriberId,
        channel: channelId
    })

    if (existingSubscription) {
        await Subscription.deleteOne({
            _id: existingSubscription._id
        })

        return res.status(200).json(
            new ApiResponse(
                200,
                {
                    subscribed: false
                },
                "Unsubscribed"
            )
        )
    }

    const subscriber = await Subscription.create({
        subscriber: subscriberId,
        channel: channelId
    })

    return res.status(201).json(
        new ApiResponse(
            200,
            {
                subscribed: true,
                subscriber
            },
            "Subscribed"
        )
    )
})

const getUserChannelSubscribers = asyncHandler(async (req, res) => {
    const { channelId } = req.params

    if (!channelId) {
        throw new ApiError(400, "Channel ID is required");
    }

    const subscribers = await Subscription.aggregate([
        {
            $match: {
                channel: new mongoose.Types.ObjectId(channelId)
            }
        },
        {
            $lookup: {
                from: "users",
                localField: "subscriber",
                foreignField: "_id",
                as: "subscriber",
                pipeline: [
                    {
                        $project: {
                            _id: 1,
                            username: 1,
                            avatar: 1
                        }
                    }
                ]
            }
        },
        {
            $unwind: "$subscriber"
        },
        {
            $project: {
                _id: 0,
                subscriber: 1,
                subscribedAt: "$createdAt"
            }
        }
    ])

    return res.status(200).json(
        new ApiResponse(200, subscribers, "Subscribers fetched successfully")
    )
})

const getSubscribedChannels = asyncHandler(async (req, res) => {
    const { subscriberId } = req.params
    const userId = req.user?._id

    if (!subscriberId) {
        throw new ApiError(400, "Subscriber ID is required");
    }

    if (userId && userId.toString() !== subscriberId) {
        throw new ApiError(403, "You have no access to view this data")
    }

    const channels = await Subscription.aggregate([
        {
            $match: {
                subscriber: new mongoose.Types.ObjectId(subscriberId)
            }
        },
        {
            $lookup: {
                from: "users",
                localField: "channel",
                foreignField: "_id",
                as: "channel",
                pipeline: [
                    {
                        $project: {
                            _id: 1,
                            username: 1,
                            avatar: 1
                        }
                    }
                ]
            }
        },
        {
            $unwind: "$channel"
        },
        {
            $project: {
                _id: 0,
                channel: 1,
                subscribedAt: "$createdAt"
            }
        }
    ])

    return res.status(201).json(
        new ApiResponse(200, channels, "Subscribed channels fetched successfully")
    )
})

export {
    toggleSubscription,
    getUserChannelSubscribers,
    getSubscribedChannels
}