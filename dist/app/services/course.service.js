"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.courseService = void 0;
const AppError_1 = require("../error/AppError");
const prisma_1 = require("../lib/prisma");
/**
 * @desc Create a new course
 * @param data - Course input data
 * @returns Newly created course object
 * @throws AppError if a course with the same title already exists for the author
 */
const createCourse = (data) => __awaiter(void 0, void 0, void 0, function* () {
    const exists = yield prisma_1.prisma.course.findFirst({
        where: {
            title: data.title,
            authorId: data.authorId,
        },
    });
    if (exists)
        throw new AppError_1.AppError(400, "Course with this title already exists for this author");
    let thumbnailPublicId = data.thumbnailPublicId;
    let overviewVideoPublicId = data.overviewVideoPublicId;
    return yield prisma_1.prisma.course.create({
        data: {
            title: data.title,
            thumbnail: data.thumbnail,
            thumbnailPublicId,
            overviewVideo: data.overviewVideo,
            overviewVideoPublicId,
            price: Number(data.price),
            isFree: Boolean(data.isFree),
            description: data.description,
            authorId: data.authorId,
            categoryId: data.categoryId,
            features: data.features,
            stack: data.stack,
            overviews: data.overviews,
        },
    });
});
/**
 * @desc Get course by ID with lessons, author, category, and enrollment info
 * @param id - Course ID
 * @param userId - User ID (to check enrollment)
 * @returns Course object with additional fields: lessonsCount, enrollmentsCount, isEnrolled
 * @throws AppError if course not found or deleted
 */
const getCourseById = (id, userId) => __awaiter(void 0, void 0, void 0, function* () {
    const course = yield prisma_1.prisma.course.findUnique({
        where: { id },
        include: {
            author: true,
            category: true,
            lessons: true,
            enrollments: { where: { userId }, select: { id: true } },
        },
    });
    if (!course || course.isDeleted)
        throw new AppError_1.AppError(404, "Course not found");
    const { lessons, enrollments } = course, rest = __rest(course, ["lessons", "enrollments"]);
    return Object.assign(Object.assign({}, rest), { lessonsCount: lessons.length, enrollmentsCount: yield prisma_1.prisma.enrollment.count({ where: { courseId: id } }), isEnrolled: enrollments.length > 0 });
});
/**
 * @desc Get all courses with optional filters, pagination, and sorting
 * @param query - Filter and pagination params (category, searchTerm, sort, page, limit)
 * @returns Object with courses array, totalPages, currentPage, totalCourses
 */
const getAllCourses = (query) => __awaiter(void 0, void 0, void 0, function* () {
    let { category, searchTerm, sort, page, limit } = query;
    page = parseInt(page, 10);
    limit = parseInt(limit, 10);
    const pageNumber = Number.isNaN(page) || page < 1 ? 1 : page;
    const limitNumber = Number.isNaN(limit) || limit < 1 ? 6 : limit;
    const skip = (pageNumber - 1) * limitNumber;
    const where = { isDeleted: false };
    if (category)
        where.category = { name: { contains: category, mode: "insensitive" } };
    if (searchTerm)
        where.OR = [
            { title: { contains: searchTerm, mode: "insensitive" } },
            { description: { contains: searchTerm, mode: "insensitive" } },
        ];
    let orderBy = {};
    if (sort === "price-asc")
        orderBy = { price: "asc" };
    else if (sort === "price-desc")
        orderBy = { price: "desc" };
    else
        orderBy = { createdAt: "desc" };
    const totalCourses = yield prisma_1.prisma.course.count({ where });
    const courses = yield prisma_1.prisma.course.findMany({
        where,
        include: { author: true, category: true, lessons: true, enrollments: true },
        orderBy,
        skip,
        take: limitNumber,
    });
    return {
        courses: courses.map((_a) => {
            var { lessons, enrollments } = _a, rest = __rest(_a, ["lessons", "enrollments"]);
            return (Object.assign(Object.assign({}, rest), { lessonsCount: lessons.length, enrollmentsCount: enrollments.length }));
        }),
        totalPages: Math.ceil(totalCourses / limitNumber),
        currentPage: pageNumber,
        totalCourses,
    };
});
/**
 * @desc Get all courses of a specific author
 * @param authorId - Author user ID
 * @returns Array of courses with author, category, and lessons
 */
const getCoursesByAuthor = (authorId) => __awaiter(void 0, void 0, void 0, function* () {
    const courses = yield prisma_1.prisma.course.findMany({
        where: { authorId },
        include: {
            author: true,
            category: true,
            lessons: true,
        },
    });
    return courses;
});
/**
 * @desc Update course by ID
 * @param id - Course ID
 * @param data - Partial course data to update
 * @returns Updated course object
 * @throws AppError if course not found or deleted
 */
const updateCourseById = (id, data) => __awaiter(void 0, void 0, void 0, function* () {
    const course = yield prisma_1.prisma.course.findUnique({ where: { id } });
    if (!course || course.isDeleted)
        throw new AppError_1.AppError(404, "Course not found");
    return prisma_1.prisma.course.update({ where: { id }, data });
});
/**
 * @desc Soft delete course by ID (marks isDeleted = true)
 * @param id - Course ID
 * @returns Updated course object
 * @throws AppError if course not found or already deleted
 */
const softDeleteCourseById = (id) => __awaiter(void 0, void 0, void 0, function* () {
    const course = yield prisma_1.prisma.course.findUnique({ where: { id } });
    if (!course || course.isDeleted)
        throw new AppError_1.AppError(404, "Course not found");
    return prisma_1.prisma.course.update({ where: { id }, data: { isDeleted: true } });
});
/**
 * @desc Restore a soft-deleted course by ID (marks isDeleted = false)
 * @param id - Course ID
 * @returns Updated course object
 * @throws AppError if course not found
 */
const restoreCourseById = (id) => __awaiter(void 0, void 0, void 0, function* () {
    const course = yield prisma_1.prisma.course.findUnique({ where: { id } });
    if (!course)
        throw new AppError_1.AppError(404, "Course not found");
    return prisma_1.prisma.course.update({ where: { id }, data: { isDeleted: false } });
});
exports.courseService = {
    createCourse,
    getCourseById,
    getAllCourses,
    updateCourseById,
    softDeleteCourseById,
    restoreCourseById,
    getCoursesByAuthor,
};
