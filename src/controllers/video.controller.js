import mongoose, {isValidObjectId} from "mongoose"
import {Video} from "../models/video.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import {deleteFromCloudinary, uploadOnCloudinary} from "../utils/cloudinary.js"

const getAllVideos = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, query, sortBy = "createdAt", sortType = "desc", userId } = req.query

    const allowedSortFields = ["createdAt", "views", "duration"]
    if (!allowedSortFields.includes(sortBy)) {
        throw new ApiError(400, "Invalid sort field")
    }

    const match = { isPublished: true }

    if (query) {
        match.$or = [
            {
                title: {
                    $regex: query,
                    $options: "i"
                }
            },
            {
                description: {
                    $regex: query,
                    $options: "i"
                }
            }
        ]
    }

    if (userId) {
        if (!isValidObjectId(userId)) {
            throw new ApiError(400, "Invalid user ID")
        }
        match.owner = new mongoose.Types.ObjectId(userId)
    }

    const sort = {
        [sortBy]: sortType === "asc" ? 1 : -1
    }

    const allVideos = Video.aggregate([
        {
            $match: match
        },
        {
            $lookup: {
                from: "users",
                localField: "owner",
                foreignField: "_id",
                as: "owner",
                pipeline: [
                    {
                        $project: {
                            fullName: 1,
                            username: 1,
                            avatar: 1
                        }
                    }
                ]
            }
        },
        {
            $addFields: {
                owner: {
                    $first: "$owner"
                }
            }
        },
        {
            $sort: sort
        }
    ])

    const videos = await Video.aggregatePaginate(allVideos, {
        page: Number(page),
        limit: Number(limit)
    })

    return res.status(200).json(
        new ApiResponse(200, videos, "All videos fetched seccessfully")
    )
})

const publishAVideo = asyncHandler(async (req, res) => {
    const { title, description } = req.body

    if (!title || !description) {
        throw new ApiError(400, "Title and description are required")
    }

    const videoFileLocalPath = req.files?.videoFile[0]?.path;
    const thumbnailLocalPath = req.files?.thumbnail[0]?.path;

    if (!videoFileLocalPath) {
        throw new ApiError(400, "Video file is required")
    }

    if (!thumbnailLocalPath) {
        throw new ApiError(400, "Thumbnail is required")
    }

    const videoFile = await uploadOnCloudinary(videoFileLocalPath)
    const thumbnail = await uploadOnCloudinary(thumbnailLocalPath)

    if (!videoFile?.url) {
        throw new ApiError(400, "Video file upload failed in cloudinary")
    }

    if (!thumbnail?.url) {
        throw new ApiError(400, "Thumbnail upload failed in cloudinary")
    }

    const video = await Video.create({
        title,
        description,
        videoFile: videoFile.url,
        thumbnail: thumbnail.url,
        duration: videoFile.duration || 0,
        // views,
        isPublished: true,
        owner: req.user._id
    })

    return res.status(201).json(
        new ApiResponse(201, video, "Video uploaded successfully")
    )
})

const getVideoById = asyncHandler(async (req, res) => {
    const { videoId } = req.params

    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid video ID");
    }
    
    const video = await Video.findByIdAndUpdate(
        videoId,
        {
            $inc: {
                views: 1
            }
        },
        { new: true }
    ).populate("owner", "fullName username avatar")

    if (!video) {
        throw new ApiError(404, "Video not found");
    }

    return res.status(200).json(
        new ApiResponse(200, video, "Video fetched successfully")
    )
})

const updateVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    
    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid video ID")
    }

    const video = await Video.findById(videoId)

    if (!video) {
        throw new ApiError(404, "Video not found");
    }

    if (video.owner.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "Unauthorized to update this video");
    }

    const { title, description } = req.body
    const thumbnailLocalPath = req.file?.path

    if (!title && !description && !thumbnailLocalPath) {
        throw new ApiError(400, "No fields to update")
    }

    const thumbnail = await uploadOnCloudinary(thumbnailLocalPath)

    if (!thumbnail.url) {
        throw new ApiError(400, "Thumbnail upload failed on cloudinary")
    }

    if (video.thumbnail) {
        try {
            const oldThumbnail = video.thumbnail.split("/").pop().split(".")[0]
            await deleteFromCloudinary(oldThumbnail)
        } catch (error) {
            throw new ApiError(400, "Thumbnail delete failed from cloudinary")
        }
    }

    const updatedVideo = await Video.findByIdAndUpdate(
        videoId,
        {
            $set: {
                title,
                description,
                thumbnail: thumbnail.url
            }
        },
        { new: true }
    )

    return res.status(200).json(
        new ApiResponse(200, updatedVideo, "Video details updated successfully")
    )
})

const deleteVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    
    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid video ID")
    }

    const video = await Video.findById(videoId)

    if (!video) {
        throw new ApiError(404, "Video not found");
    }

    if (video.owner.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "Unauthorized to delete this video");
    }

    try {
        const videoPublicId = video.videoFile.split("/").pop().split(".")[0]
        const thumbnailPublicId = video.thumbnail.split("/").pop().split(".")[0]

        await deleteFromCloudinary(videoPublicId)
        await deleteFromCloudinary(thumbnailPublicId)
    } catch (error) {
        throw new ApiError(500, "Error deleting media from Cloudinary")
    }

    await Video.findByIdAndDelete(videoId)

    return res.status(200).json(
        new ApiResponse(200, {}, "Video deleted successfully")
    )
})

const togglePublishStatus = asyncHandler(async (req, res) => {
    const { videoId } = req.params

    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid video ID")
    }

    const video = await Video.findById(videoId)

    if (!video) {
        throw new ApiError(404, "Video not found");
    }

    if (video.owner.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "Unauthorized to change publish status");
    }

    video.isPublished = !video.isPublished;
    await video.save();

    return res.status(200).json(
        new ApiResponse(200, video, "Video published status updated successfully")
    )
})

export {
    getAllVideos,
    publishAVideo,
    getVideoById,
    updateVideo,
    deleteVideo,
    togglePublishStatus
}