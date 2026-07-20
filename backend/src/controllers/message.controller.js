import Message from "../models/Message.js";
import User from "../models/User.js";

export const getAllContacts = async (req, res) => {
    try{
        const loggedInUserId = req.user._id;
        const filteredUsers = await User.find({ _id: { $ne: loggedInUserId } }).select("-password");

        res.status(200).json(filteredUsers);
    }catch(err){
        console.error("Error getting contacts:", err);
        res.status(500).json({ message: "Internal server error" });
    }
}

export const getMessagesByUserId = async (req, res) => {
    try {

        const myId = req.user._id;
        const {id:userToChatId} = req.params;

        const messages = await Message.find({
            $or: [
                { senderId: myId, receiverId: userToChatId },
                { senderId: userToChatId, receiverId: myId }
            ]
        });

        res.status(200).json(messages);

    }catch(err){
        console.error("Error getting messages:", err);
        res.status(500).json({ message: "Internal server error" });
    }
}

export const sendMessage = async (req, res) => {
    try{
        const {text, image} = req.body;
        const {id: receiverId} = req.params;
        const senderId = req.user._id;

        let imageUrl;
        if(image){
            // Upload image to cloudinary
            const uploadResponse = await cloudinary.uploader.upload(image);
            imageUrl = uploadResponse.secure_url;
        }

        const newMessage = new Message({
            senderId,
            receiverId,
            text,
            image: imageUrl
        });

        await newMessage.save();
        res.status(201).json(newMessage);
    }catch(err){
        console.error("Error sending message:", err);
        res.status(500).json({ message: "Internal server error" });
    }
}

export const getChatPartners = async (req, res) => {
    try{
        const loggedInUserId = req.user._id;
        const messages = await Message.find({
            $or: [{senderId: loggedInUserId}, {receiverId: loggedInUserId}],
        });

        const chatPartnerIds = [...new Set(messages.map((msg) => msg.senderId.toString() === loggedInUserId.toString() ? msg.receiverId.toString() : msg.senderId.toString()))];

        const chatPartners = await User.find({_id: {$in: chatPartnerIds}}).select("-password");

        res.status(200).json(chatPartners);
    }catch(err){
        console.log("Error in getChatPartners: ", err.message);
        res.status(500).json({err: "Internal server error"});
    }
}