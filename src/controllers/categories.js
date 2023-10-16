import Category from '../models/categories';
import { categorySchema } from '../validation/categories';
import { typeRequestMw } from '../middleware/configResponse';

const { RESPONSE_MESSAGE, RESPONSE_STATUS, RESPONSE_OBJ } = typeRequestMw;
export const createCategory = async (req, res, next) => {
   try {
      const defaultCategory = await Category.findOne({ type: req.type });
      if (defaultCategory.type == 'default') {
         req[RESPONSE_STATUS] = 500;
         req[RESPONSE_MESSAGE] = `Only one default Category`;
         return next();
      }
      const { error } = categorySchema.validate(req.body, { abortEarly: false });
      if (error) {
         req[RESPONSE_STATUS] = 500;
         req[RESPONSE_MESSAGE] = `Form error: ${error.details[0].message}`;
         return next();
      }
      const category = await Category.create(req.body);
      if (!category) {
         req[RESPONSE_STATUS] = 500;
         req[RESPONSE_MESSAGE] = `Create failed`;
         return next();
      }
      req[RESPONSE_MESSAGE] = `Create category successfully`;
      req[RESPONSE_OBJ] = category;
      return next();
   } catch (error) {
      req[RESPONSE_STATUS] = 500;
      req[RESPONSE_MESSAGE] = `Error: ${error.message}`;
      return next();
   }
};
export const updateCategory = async (req, res, next) => {
   try {
      const defaultCategory = await Category.findOne({ type: 'default' });
      if (defaultCategory.type === req.body.type) {
         req[RESPONSE_STATUS] = 500;
         req[RESPONSE_MESSAGE] = `Only one default Category`;
         return next();
      }
      const { error } = categorySchema.validate(req.body, { abortEarly: false });
      if (error) {
         req[RESPONSE_STATUS] = 500;
         req[RESPONSE_MESSAGE] = `Form error: ${error.details[0].message}`;
         return next();
      }
      const { id } = req.params;
      const existCategory = await Category.findById({ _id: id });
      if (!existCategory) {
         req[RESPONSE_STATUS] = 500;
         req[RESPONSE_MESSAGE] = `Category is not exist`;
         return next();
      }
      const category = await Category.findByIdAndUpdate(req.params.id, req.body, { new: true });
      req[RESPONSE_MESSAGE] = `update category successfully`;
      req[RESPONSE_OBJ] = category;
      return next();
   } catch (error) {
      req[RESPONSE_STATUS] = 500;
      req[RESPONSE_MESSAGE] = `Error: ${error.message}`;
      return next();
   }
};
export const removeCategories = async (req, res, next) => {
   try {
      const category = await Category.findOne({ _id: req.params.id });
      // không cho phép xóa danh mục mặc định
      const defaultCategory = await Category.findOne({ type: 'default' });
      const defaultCategoryId = defaultCategory._id;
      if (category.type == 'default') {
         req[RESPONSE_MESSAGE] = `Can not delete Default category`;
         return next();
      }
      await Product.updateMany({ categoryId: category._id }, { $set: { categoryId: defaultCategoryId } });
      // thêm id của sản phẩm vào danh mục mạc định
      await Category.findByIdAndUpdate(
         defaultCategoryId,
         {
            $push: { subCategories: category.subCategories, products: category.products },
         },
         { new: true },
      );

      const removedCategory = await Category.findOneAndDelete({ _id: req.params.id });
      if (!removedCategory) {
         req[RESPONSE_STATUS] = 400;
         req[RESPONSE_MESSAGE] = `Not found category`;
         return next();
      }
      req[RESPONSE_MESSAGE] = `Delete category successfully`;
      req[RESPONSE_OBJ] = removedCategory;
      return next();
   } catch (error) {
      req[RESPONSE_STATUS] = 500;
      req[RESPONSE_MESSAGE] = `Error: ${error.message}`;
      return next();
   }
};
export const getAllCategory = async (req, res, next) => {
   try {
      const category = await Category.find();
      if (category.length === 0) {
         req[RESPONSE_MESSAGE] = `Not found any categories`;
         req[RESPONSE_OBJ] = category;
         next();
      }
      req[RESPONSE_MESSAGE] = `Get all category successfully`;
      req[RESPONSE_OBJ] = category;
      next();
   } catch (error) {
      req[RESPONSE_MESSAGE] = `Error: ${error.message}`;
      req[RESPONSE_STATUS] = 500;
      next();
   }
};
export const getOneCategory = async (req, res, next) => {
   try {
      const category = await Category.findById(req.params.id);
      if (!category) {
         req[RESPONSE_STATUS] = 500;
         req[RESPONSE_MESSAGE] = `Get one category failed`;
         return next();
      }
      req[RESPONSE_MESSAGE] = `Get one category successfully`;
      req[RESPONSE_OBJ] = category;
      return next();
   } catch (error) {
      req[RESPONSE_STATUS] = 500;
      req[RESPONSE_MESSAGE] = `Error: ${error.message}`;
      return next();
   }
};