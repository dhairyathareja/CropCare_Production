import User from "../models/user.js";
import ErrorWrapper from "../utils/ErrorWrapper.js";
import ErrorHandler from "../utils/ErrorHandler.js";
import uploadOnCloudinary from "../utils/uploadOnCloudinary.js";



const generateAccessAndRefreshToken=async(userId)=>{
    try {
        
        let user= await User.findOne({
            _id:userId
        })
        const accessToken=await user.generateAccessToken();
        const refreshToken= await user.generateRefreshToken();
        
        return {refreshToken,accessToken}

    } catch (error) {
        throw new ErrorHandler(501,`Error While Generating Refresh And Access Token`);
    }
}

export const postSignUp=ErrorWrapper(async(req,res,next)=>{
    

    const {name,email,password}=req.body;
    const requiredField=["name","email","password"];
    const incomingField=Object.keys(req.body);
    const missingField=requiredField.filter((field)=> !incomingField.includes(field));

    let regex = /^[a-z0-9]+@[a-z]+\.[a-z]{2,3}$/;
    let validEmail = regex.test(email);
    
    if(!validEmail){
        throw new ErrorHandler(401,`Please Enter a Valid Email `);
    }

    if(missingField.length>0){
        throw new ErrorHandler(401,`Please Enter the Missing Fields: ${missingField.join(',')} to SignUp`);
    }

    
    let existingUser= await User.findOne({email:email});

    if(existingUser){ 
        throw new ErrorHandler(401,`Email: ${email} already exist`);
    }


    let cloudinaryResponse;
    try {
        cloudinaryResponse=await uploadOnCloudinary(req.file.buffer);
    } catch (error) {
        throw new ErrorHandler(501,`Error On Uploading Image.`,error.message);
    } 

    try {
        const user=await User.create({
            name,
            email,
            password,
            profileImage:cloudinaryResponse.url
        });

        let newUser= await User.findOne({
            _id:user._id
        }).select('-password');
        
        const {accessToken,refreshToken}= await generateAccessAndRefreshToken(newUser._id);
        newUser.refreshToken=refreshToken
        await newUser.save()
        
        res.status(200)
        .cookie("RefreshToken",refreshToken)
        .cookie("AccessToken",accessToken)
        .json({
            success:true,
            user:newUser
        })

    } catch (error) {
        throw new ErrorHandler(501,`Can't SignUp try later or Contact Admin`);
    }
})

export const postLogin=ErrorWrapper(async(req,res,next)=>{
    const {email,password} = req.body;

    if(!email){
        throw new ErrorHandler(401,`Please Enter Email`);
    }

    if(!password){
        throw new ErrorHandler(400,`Please Provide Password For Login`);
    }

    let user=await User.findOne({email: email})
    if(!user){
        throw new ErrorHandler(400,`Email does not exist`);
    }
    
    const checkPassword=await user.isPasswordCorrect(password)


    if(!checkPassword){
        throw new ErrorHandler(400,`Entered Password is not correct`);
    }

    const {accessToken,refreshToken}= await generateAccessAndRefreshToken(user._id);
    user.refreshToken=refreshToken
    await user.save()

    user=await User.find({
        _id:user._id
    }).select("-password -refreshToken");

    res.status(200)
        .cookie("RefreshToken",refreshToken)
        .cookie("AccessToken",accessToken)
        .json({
            success:true,
            message:"Login Succcessful",
            user
        })
})


export const postLogout=ErrorWrapper(async(req,res,next)=>{
    try{
        const {email}=req.body;
        let user=await User.findOne({email:email});
        if(!user){
            throw new ErrorHandler(401,`User Does not Exist`);
        }
        user.refreshToken="";
        await user.save();


        user=await User.find({
            _id:user._id
        }).select("-password -refreshToken");        

        res.status(200)
        .cookie("RefreshToken","")
        .cookie("AccessToken","")
        .json({
                success:true,
                message:"Logout Successfully",
        })
    }
    catch (error) {
        throw new ErrorHandler(501,error);
    }
    
})