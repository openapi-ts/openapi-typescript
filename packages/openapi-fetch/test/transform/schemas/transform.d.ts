/**
 * This file was manually created based on transform.yaml
 */

import type { PathsWithMethod } from "openapi-typescript-helpers";

export interface paths {
  "/posts": {
    get: {
      responses: {
        200: {
          content: {
            "application/json": {
              items: any[];
              meta: {
                total: number;
              };
            };
          };
        };
      };
    };
    post: {
      requestBody: {
        content: {
          "application/json": {
            title: string;
            content: string;
          };
        };
      };
      responses: {
        200: {
          content: {
            "application/json": {
              id: number;
              name: string;
              created_at: string;
              updated_at: string;
            };
          };
        };
      };
    };
  };
  "/posts/{id}": {
    get: {
      parameters: {
        path: {
          id: number;
        };
      };
      responses: {
        200: {
          content: {
            "application/json": {
              id: number;
              title: string;
              content: string;
              created_at: string;
              updated_at: string;
            };
          };
        };
      };
    };
  };
} 