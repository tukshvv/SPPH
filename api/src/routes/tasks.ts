import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { createTask, createTasksFromText, deleteTask, listTasks, updateTask } from '../services/taskService.js';
import { createTaskSchema, taskQuerySchema, tasksFromTextSchema, updateTaskSchema } from '../schemas/tasks.js';

export const taskRouter = Router();

taskRouter.use(requireAuth);

taskRouter.get('/', validate(taskQuerySchema), async (req, res, next) => {
  try {
    const userId = req.authUserId!;
    const tasks = await listTasks(userId, req.query.status as string | undefined);
    res.json({ tasks });
  } catch (error) {
    next(error);
  }
});

taskRouter.post('/', validate(createTaskSchema), async (req, res, next) => {
  try {
    const userId = req.authUserId!;
    const task = await createTask(userId, req.body);
    res.status(201).json({ task });
  } catch (error) {
    next(error);
  }
});

taskRouter.patch('/:id', validate(updateTaskSchema), async (req, res, next) => {
  try {
    const userId = req.authUserId!;
    const task = await updateTask(userId, req.params.id, req.body);
    res.json({ task });
  } catch (error) {
    next(error);
  }
});

taskRouter.delete('/:id', async (req, res, next) => {
  try {
    const userId = req.authUserId!;
    const result = await deleteTask(userId, req.params.id);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

taskRouter.post('/from-text', validate(tasksFromTextSchema), async (req, res, next) => {
  try {
    const userId = req.authUserId!;
    const { text, chatSessionId } = req.body;
    const tasks = await createTasksFromText(userId, text, chatSessionId);
    res.status(201).json({ tasks });
  } catch (error) {
    next(error);
  }
});
