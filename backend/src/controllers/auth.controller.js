import User from "../models/User.js";
import bcrypt from "bcryptjs";
import { generateToken } from "../lib/utils.js";
import {ENV} from "../lib/env.js";
import { sendWelcomeEmail } from "../emails/emailHandlers.js";

export const signup = async (req, res) => {
    const { fullName, email, password } = req.body;

    try{
        if(!fullName || !email || !password){
            return res.status(400).json({ message: "All fields are required" });
        }
        if(password.length < 6){
            return res.status(400).json({ message: "Password must be at least 6 characters long" });
        }
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if(!emailRegex.test(email)){
            return res.status(400).json({ message: "Invalid email format" });
        }
        const user = await User.findOne({ email });
        if(user){
            return res.status(400).json({ message: "User already exists" });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        const newUser = new User({
            fullName,
            email,
            password: hashedPassword
        });
        if(newUser){
            generateToken(newUser._id, res);
            await newUser.save();
            res.status(201).json({
                _id: newUser._id,
                fullName: newUser.fullName,
                email: newUser.email,
                profilePic: newUser.profilePic,
            })

            try{
                const savedUser = await newUser.save();
                await sendWelcomeEmail(savedUser.email, savedUser.fullName, ENV.CLIENT_URL);
            }catch(err){
                console.error("Error sending welcome email:", err);
            }

        }else{
            res.status(400).json({ message: "Failed to create user" });
        }
    }catch(err){
        console.error("Error during cotroller:", err);
        res.status(500).json({ message: "Internal server error" });
    }

};

export const login = async (req, res) => {
    const { email, password } = req.body;

    try{
        const user = await User.findOne({ email });
        if(!user){
            return res.status(400).json({ message: "Invalid email or password" });
        }

        const isPassswordValid = await bcrypt.compare(password, user.password);
        if(!isPassswordValid){
            return res.status(400).json({ message: "Invalid email or password" });
        }

        generateToken(user._id, res);

        res.status(200).json({
            _id: user._id,
            fullName: user.fullName,
            email: user.email,
            profilePic: user.profilePic,
        });


    }catch(err){
        console.error("Error during login:", err);
        res.status(500).json({ message: "Internal server error" });
    }
};

export const logout = (_, res) => {
    res.cookie("jwt", "", {maxAge: 0});
    res.status(200).json({ message: "Logged out successfully" });
};