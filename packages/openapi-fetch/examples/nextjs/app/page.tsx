import React from "react";
import client from "../lib/api";

async function getFact() {
  return await client.GET("/fact", {
    params: {
      query: { max_length: 500 },
    },
  });
}

export default async function Home() {
  const fact = await getFact();

  return (
    <div>
      {fact.error ? (
        <div>There was an error: {fact.error.message}</div>
      ) : (
        <pre>
          <code>{JSON.stringify(fact.data, undefined, 2)}</code>
        </pre>
      )}
    </div>
  );
}
