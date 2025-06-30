import { Ref } from "vue";

// Read the stream from the server
// export const read = async (
//   reader: any,
//   target: Ref<string> | Ref<any[]>
// ): Promise<any> => {
//   // TextDecoder is a built-in object that allows you to convert a stream of bytes into a string
//   const decoder = new TextDecoder("utf-8");
//   // Destructure the value returned by reader.read()
//   const { done, value } = await reader.read();
//   // If the stream is done reading, release the lock on the reader
//   if (done) return reader.releaseLock();
//   // Convert the stream of bytes into a string
//   const chunk = decoder.decode(value, { stream: true });
//   // Split the string into an array of strings
//   const jsons = chunk
//     .split("data:")
//     .map((data) => {
//       // Trim any whitespace
//       const trimData = data.trim();
//       // If the string is empty, return undefined
//       if (trimData === "") return undefined;
//       // If the string is [DONE], return undefined
//       if (trimData === "[DONE]") return undefined;
//       // Otherwise, parse the string as JSON
//       return JSON.parse(data.trim());
//     })
//     // Filter out any undefined values
//     .filter((data) => data);
//   // Combine the data into a single string
//   const streamMessage = jsons
//     .map((jn) => jn.choices.map((choice: any) => choice.delta.content).join(""))
//     .join("");
//   // Update the ref to the target element with the new string
//   const response = streamMessage;
//   if (target.value instanceof Array) {
//     target.value[target.value.length - 1].content += response;
//   } else {
//     target.value = target.value += response;
//   }
//   // Repeat the process
//   return read(reader, target);
// };
// @/utils/aiUtils.ts

// import { Ref } from "vue";

// ✨ 为了让类型更清晰，我们可以在这里也定义一下
type MessagePart = { type: 'text', text: string };
interface Message {
  role: "user" | "assistant" | "system";
  content: MessagePart[];
}

export const read = async (
  reader: ReadableStreamDefaultReader<Uint8Array>,
  messages: Ref<Message[]> // 明确 target 就是 messages
): Promise<any> => {
  const decoder = new TextDecoder("utf-8");
  const { done, value } = await reader.read();

  if (done) return reader.releaseLock();

  const chunk = decoder.decode(value, { stream: true });
  const jsons = chunk
    .split("data:")
    .map((data) => {
      const trimData = data.trim();
      if (!trimData || trimData === "[DONE]") return undefined;
      try {
        return JSON.parse(trimData);
      } catch {
        return undefined;
      }
    })
    .filter((data) => data);

  const streamMessage = jsons
    .map((jn) => jn.choices.map((choice: any) => choice.delta.content || "").join(""))
    .join("");

  // --- ✨ 核心修正：只修改这里 ---
  // 确保 messages 数组有内容
  if (messages.value.length > 0) {
    const lastMessage = messages.value[messages.value.length - 1];
    // 确保最后一条消息是助手的
    if (lastMessage.role === 'assistant' && lastMessage.content.length > 0) {
      // 找到最后一个 part
      const lastPart = lastMessage.content[lastMessage.content.length - 1];
      // 确保最后一个 part 是 text 类型，然后追加
      if (lastPart && lastPart.type === 'text') {
        lastPart.text += streamMessage; // 👈 从 `content +=` 改为 `part.text +=`
      }
    }
  }
  // --- 修正结束 ---

  return read(reader, messages);
};

// ... 你的 countAndCompleteCodeBlocks 函数可以保持不变 ...
// Count the number of code blocks and complete the last one if it is not completed
export const countAndCompleteCodeBlocks = (text: string) => {
  const codeBlocks = text.split("```").length - 1;
  if (codeBlocks && codeBlocks % 2 !== 0) {
    return text + "\n```\n";
  }
  return text;
};
