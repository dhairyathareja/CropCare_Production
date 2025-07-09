import { v2 as cloudinary } from 'cloudinary';
import streamifier from 'streamifier'; //Buffer 
// import fs from 'fs'



// const uploadOnCloudinary=async(filePath)=>{
    
//     try {
//         if(!filePath) return null
//         const response = await cloudinary.uploader.upload(filePath,{folder:'CropCare'});
//         fs.unlinkSync(filePath);
//         return response;

//     } catch (error) {
//         fs.unlinkSync(filePath);
//         return error;
//     }    
       
// }

const uploadOnCloudinary = (buffer, filename) => {

    // Configuration
  cloudinary.config({ 
      cloud_name: process.env.CLOUDINARY_NAME, 
      api_key: process.env.CLOUDINARY_API_KEY, 
      api_secret: process.env.CLOUDINARY_API_SECRET
  });

  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: 'CropCare',
        public_id: filename
      },
      (error, result) => {
        if (error) reject(error);
        else resolve(result);
      }
    );
    streamifier.createReadStream(buffer).pipe(stream);
  });
};

export default uploadOnCloudinary;
