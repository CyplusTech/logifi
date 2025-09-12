const multer = require("multer");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const cloudinary = require("cloudinary").v2;
const path = require("path");

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// custom storage
const storage = new CloudinaryStorage({
  cloudinary,
  params: async (req, file) => {
    let folder = "logifi_uploads";

    // Detect resource type automatically
    let resource_type = file.mimetype.startsWith("video")
      ? "video"
      : "image";

    // Remove extension from original name → avoid `.png.png`
    const fileName = path.parse(file.originalname).name;

    return {
      folder,
      resource_type, // Cloudinary handles jpg, png, webp, mp4, mov, etc.
      public_id: `${Date.now()}-${fileName}`,
      // Cloudinary auto-adds the correct extension
      format: path.extname(file.originalname).slice(1) || undefined, 
    };
  },
});

const upload = multer({ storage });

module.exports = { cloudinary, upload };
