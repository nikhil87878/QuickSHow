import express from 'express';

import { addshow,getNowPlayingMovies, getShows,getShow } from '../controllers/showController.js';
import { protectAdmin } from '../middleware/auth.js';

const showRouter = express.Router();

showRouter.get('/now-playing',getNowPlayingMovies)
showRouter.post('/add',addshow)
showRouter.get("/all",getShows)
showRouter.get("/:movieId",getShow)


export default showRouter;