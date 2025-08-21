import express from "express";
import { courseController } from "./course.controller";
import { authenticate } from "../../middleware/authenticate";
import { upload } from "../../lib/cloudinary";
import { validateRequest } from "../../middleware/validateRequest";
import { createCourseZodSchema } from "./course.validation";

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Courses
 *   description: APIs to manage courses
 */

/**
 * @swagger
 * /api/courses:
 *   post:
 *     summary: Create a new course
 *     tags: [Courses]
 *     security:
 *       - bearerAuth: []
 */
router.post(
  "/",
  authenticate,
  upload.fields([{ name: "thumbnail", maxCount: 1 }, { name: "overviewVideo", maxCount: 1 }]),
  validateRequest(createCourseZodSchema),
  courseController.createCourse
);

/**
 * @swagger
 * /api/courses:
 *   get:
 *     summary: Get all courses
 *     tags: [Courses]
 *     parameters:
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *         description: Filter by category
 *       - in: query
 *         name: searchTerm
 *         schema:
 *           type: string
 *         description: Search by course title or description
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: Page number for pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Number of courses per page
 *       - in: query
 *         name: sort
 *         schema:
 *           type: string
 *         description: Sorting order (price-asc, price-desc)
 *     responses:
 *       200:
 *         description: List of courses
 */

router.get("/", courseController.getAllCourses);

/**
 * @swagger
 * /api/courses/{id}:
 *   get:
 *     summary: Get course by ID
 *     tags: [Courses]
 *     security:
 *       - bearerAuth: []
 */
router.get("/:id", authenticate, courseController.getCourseById);

/**
 * @swagger
 * /api/courses/{id}:
 *   patch:
 *     summary: Update course by ID
 *     tags: [Courses]
 *     security:
 *       - bearerAuth: []
 */
router.patch("/:id", authenticate, courseController.updateCourseById);

/**
 * @swagger
 * /api/courses/{id}/delete:
 *   patch:
 *     summary: Soft delete a course by ID
 *     tags: [Courses]
 *     security:
 *       - bearerAuth: []
 */
router.patch("/:id/delete", authenticate, courseController.softDeleteCourseById);

/**
 * @swagger
 * /api/courses/{id}/restore:
 *   patch:
 *     summary: Restore a soft-deleted course by ID
 *     tags: [Courses]
 *     security:
 *       - bearerAuth: []
 */
router.patch("/:id/restore", authenticate, courseController.restoreCourseById);

export const courseRoutes = router;
