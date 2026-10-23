"use strict";
const fs = require("fs");
const WebSocket = require("ws");

async function connect() {
  const pages = await (await fetch("http://127.0.0.1:9223/json")).json();
  const socket = new WebSocket(pages.find(page => page.type === "page").webSocketDebuggerUrl);
  await new Promise(resolve => socket.once("open", resolve));
  let id = 0;
  const pending = new Map();
  socket.on("message", data => {
    const message = JSON.parse(data);
    if (pending.has(message.id)) {
      const { resolve, reject } = pending.get(message.id);
      pending.delete(message.id);
      message.error ? reject(new Error(JSON.stringify(message.error))) : resolve(message.result);
    }
  });
  const send = (method, params = {}) => new Promise((resolve, reject) => {
    const key = ++id;
    pending.set(key, { resolve, reject });
    socket.send(JSON.stringify({ id: key, method, params }));
  });
  const evaluate = async (expression, userGesture = false) => {
    const result = await send("Runtime.evaluate", { expression, awaitPromise: true, returnByValue: true, userGesture });
    if (result.exceptionDetails) throw new Error(JSON.stringify(result.exceptionDetails));
    return result.result.value;
  };
  return { send, evaluate, close: () => socket.close() };
}

async function waitFor(client, expression, timeout = 15000) {
  const start = Date.now();
  while (Date.now() - start < timeout) {
    if (await client.evaluate(expression)) return;
    await new Promise(resolve => setTimeout(resolve, 150));
  }
  throw new Error("Timed out: " + expression);
}

module.exports = { connect, waitFor };
