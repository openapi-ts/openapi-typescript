import type { Router } from "@adonisjs/http-server";

export type AdonisRoutes = ReturnType<Router["toJSON"]>[string];
export type AdonisRoute = AdonisRoutes[number];
