import cloudinary from "../config/cloudinary";

export const uploadImage = async (req, res) => {
  const files = req.files;
  if (!Array.isArray(files)) {
    return res.status(400).json({ error: "No files were uploaded" });
  }
  try {
    const uploadPromises = files.map((file) => {
      return cloudinary.uploader.upload(file.path);
    });
    const results = await Promise.all(uploadPromises);
    const uploadedFiles = results.map((result) => ({
      url: result.secure_url,
      public_id: result.public_id,
    }));
    return res.status(200).json({
      body:{
        data:uploadedFiles
      },
    });
  } catch (error) {
    console.log(error.message);
    return res.status(400).json({
      message: "Something wrong!",
    });
  }
};

export const deleteImage = async (req, res) => {
  const publicId = req.params.publicId;
  try {
    const result = await cloudinary.uploader.destroy(publicId);
    return res
      .status(200)
      .json({ message: "Xóa ảnh thành công", body: result });
  } catch (error) {
    console.log(error.message);
    return res.status(400).json({
      message: "Something wrong!",
    });
  }
};
