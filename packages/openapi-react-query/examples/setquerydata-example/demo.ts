// Example demonstrating setQueryData with type safety
import createFetchClient from "openapi-fetch";
import createClient from "../../src";
// NOTE: If running locally, ensure you import from the local source, not the package name, to avoid module resolution errors.
import { QueryClient } from "@tanstack/react-query";
import type { paths, components } from "./api";

type Post = components["schemas"]["Post"];

// Create clients
const fetchClient = createFetchClient<paths>({
  baseUrl: "https://api.example.com",
});
const $api = createClient(fetchClient);
const queryClient = new QueryClient();

// Simulate creating a new post
const newPost: Post = {
  id: "123",
  title: "New Post",
  content: "Post content",
  createdAt: new Date().toISOString(),
};

// Example 1: Update posts list with updater function
async function createPostAndUpdateCache() {
  $api.setQueryData(
    "get",
    "/posts",
    (oldPosts) => {
      return oldPosts ? [...oldPosts, newPost] : [newPost];
    },
    queryClient,
    {},
  );

  return newPost;
}

// Example 2: Update a single post after editing
async function updatePostAndUpdateCache(postId: string, updates: { title?: string; content?: string }) {
  // Update the specific post cache with updater function
  $api.setQueryData(
    "get",
    "/posts/{id}",
    (oldPost) => {
      // TypeScript ensures oldPost is Post | undefined
      // and we must return Post
      if (!oldPost) {
        throw new Error("No post in cache");
      }
      return { ...oldPost, ...updates };
    },
    queryClient,
    { params: { path: { id: postId } } },
  );
}

// Example 3: Directly set the data
function clearPostsCache() {
  $api.setQueryData("get", "/posts", [newPost], queryClient, {});
}

export { createPostAndUpdateCache, updatePostAndUpdateCache, clearPostsCache };
