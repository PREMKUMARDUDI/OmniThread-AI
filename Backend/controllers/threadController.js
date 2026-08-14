import Thread from "../models/Thread.js";
import User from "../models/User.js";
import getGeminiAPIResponse from "../utils/gemini.js";

export const getAllThreads = async (req, res) => {
  try {
    const threads = await Thread.find({ userId: req.user.id }).sort({
      updatedAt: -1,
    });
    res.status(200).json(threads);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

export const getThreadById = async (req, res) => {
  const { threadId } = req.params;

  try {
    const thread = await Thread.findOne({ threadId, userId: req.user.id });

    if (!thread) {
      return res.status(404).json({ error: "Thread not found!" });
    }

    res.status(200).json(thread);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

export const renameThread = async (req, res) => {
  const { threadId } = req.params;
  const { title } = req.body;

  if (!title) {
    return res.status(400).json({ error: "New title is required!" });
  }

  try {
    const updatedThread = await Thread.findOneAndUpdate(
      { threadId, userId: req.user.id },
      { title },
      { returnDocument: "after" },
    );

    if (!updatedThread) {
      return res.status(404).json({ error: "Thread not found!" });
    }

    res
      .status(200)
      .json({ message: "Thread renamed successfully!", updatedThread });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

export const deleteThread = async (req, res) => {
  const { threadId } = req.params;

  try {
    const deletedThread = await Thread.findOneAndDelete({
      threadId,
      userId: req.user.id,
    });

    if (!deletedThread) {
      return res.status(404).json({ error: "Thread not found!" });
    }

    await User.findByIdAndUpdate(req.user.id, {
      $pull: { threads: deletedThread._id },
    });

    res
      .status(200)
      .json({ message: "Thread deleted successfully!", deletedThread });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

export const handleChat = async (req, res) => {
  const { threadId, message, media } = req.body;

  if (!threadId || !message) {
    return res.status(400).json({ error: "missing threadId or message!" });
  }

  try {
    let thread = await Thread.findOne({ threadId, userId: req.user.id });
    let chatHistory = [];
    let isNewThread = !thread ? true : false;

    if (!thread) {
      const textLines = message
        .split("\n")
        .map((line) => line.trim())
        .filter((line) => line.length > 0);

      let generatedTitle = textLines.length > 0 ? textLines[0] : "New Chat";

      if (generatedTitle.length > 30) {
        generatedTitle = generatedTitle.substring(0, 30) + "...";
      }

      thread = new Thread({
        threadId,
        title: generatedTitle,
        userId: req.user.id,
        messages: [{ role: "user", content: message }],
      });
    } else {
      chatHistory = thread.messages;
      thread.messages.push({ role: "user", content: message });
    }

    const geminiResponse = await getGeminiAPIResponse(
      message,
      media,
      chatHistory,
    );

    thread.messages.push({ role: "assistant", content: geminiResponse });
    thread.updatedAt = Date.now();

    const savedThread = await thread.save();

    if (isNewThread) {
      await User.findByIdAndUpdate(req.user.id, {
        $push: { threads: savedThread._id },
      });
    }

    res.status(200).json({ reply: geminiResponse });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};
