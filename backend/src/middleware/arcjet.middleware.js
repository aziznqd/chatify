import aj from "../lib/arcjet.js";
import { isSpoofedBot } from "@arcjet/inspect";

export const arcjetProtection = async (req, res, next) => {
    try{

        const decision = await aj.protect(req);

        if(decision.isDenied()){
            if(decision.reason.isRateLimit()){
                return res.status(429).json({ message: "Too many requests. Please try again later." });
            }else if(decision.reason.isBot()){
                return res.status(403).json({ message: "Access denied. Bot traffic is not allowed." });
            }else{
                return res.status(403).json({ message: "Access denied. Suspicious activity detected." });
            }
        }

        if(decision.results.some(isSpoofedBot)){
            return res.status(403).json({ message: "Access denied. Spoofed bot traffic is not allowed." });
        }

        next();

    }catch(err){
        console.error("Error during Arcjet protection:", err);
        next();
    }
}