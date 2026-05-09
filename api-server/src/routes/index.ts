import { Router, type IRouter } from "express";
import healthRouter from "./health";
import spotifyRouter from "./spotify";
import usersRouter from "./users";
import libraryRouter from "./library";
import playlistsRouter from "./playlists";
import statsRouter from "./stats";
import streamRouter from "./stream";

const router: IRouter = Router();

router.use(healthRouter);
router.use(spotifyRouter);
router.use(usersRouter);
router.use(libraryRouter);
router.use(playlistsRouter);
router.use(statsRouter);
router.use(streamRouter);

export default router;
