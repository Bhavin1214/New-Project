import mongoose from "mongoose";

const userDeviceInfoSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Types.ObjectId,
        ref: "User",
        required: true
    },
    deviceType: { 
        type: String, 
        enum: ['android', 'ios', 'web'], 
        required: true 
    },
    deviceName: { type: String },       
    uuid: { type: String, required: true }, 
    osVersion: { type: String },       
    modelName: { type: String },        
    deviceToken: { type: String },     
    isActive: { type: Boolean, default: true },
    isDeleted: { type: Boolean, default: false },
}, {
    timestamps: true
});

const UserDeviceInfo = mongoose.model("UserDeviceInfo", userDeviceInfoSchema);
export default UserDeviceInfo;
