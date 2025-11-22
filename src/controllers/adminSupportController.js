import mongoose from 'mongoose';
import { ChatThread } from '../models/ChatThread.js';
import { ChatMessage } from '../models/ChatMessage.js';
import { formatChatMessage, formatChatThread } from '../utils/serializers.js';

const sanitizeMessage = value => {
  if (typeof value !== 'string') return '';
  return value.trim();
};

export const listSupportThreads = async (req, res, next) => {
  try {
    const { status } = req.query || {};
    const filter = {};

    if (status && status !== 'all') {
      filter.status = status;
    }

    const threads = await ChatThread.find(filter)
      .populate('user', 'fullName phone country')
      .sort({ lastMessageAt: -1, createdAt: -1 })
      .limit(200);

    res.json({
      threads: threads.map(formatChatThread)
    });
  } catch (error) {
    next(error);
  }
};

export const getSupportThreadById = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid thread id' });
    }

    const thread = await ChatThread.findById(id).populate('user', 'fullName phone country');
    if (!thread) {
      return res.status(404).json({ message: 'Support thread not found' });
    }

    const messages = await ChatMessage.find({ thread: thread.id })
      .sort({ createdAt: 1 })
      .populate('sender', 'fullName phone')
      .limit(400);

    res.json({
      thread: formatChatThread(thread),
      messages: messages.map(message => ({
        ...formatChatMessage(message),
        senderDetails:
          message.sender && typeof message.sender === 'object'
            ? {
                id: message.sender._id?.toString(),
                fullName: message.sender.fullName,
                phone: message.sender.phone
              }
            : null
      }))
    });
  } catch (error) {
    next(error);
  }
};

export const postSupportThreadMessage = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid thread id' });
    }

    const body = sanitizeMessage(req.body?.message);
    if (!body) {
      return res.status(400).json({ message: 'Message is required' });
    }

    const thread = await ChatThread.findById(id).populate('user', 'fullName phone country');
    if (!thread) {
      return res.status(404).json({ message: 'Support thread not found' });
    }

    const chatMessage = await ChatMessage.create({
      thread: thread.id,
      senderType: 'admin',
      sender: req.user.id,
      body
    });

    thread.lastMessageAt = chatMessage.createdAt;
    thread.lastMessageSnippet = body.slice(0, 280);
    thread.lastSender = 'admin';
    thread.status = 'waiting_customer';
    thread.messagesCount = (thread.messagesCount ?? 0) + 1;
    thread.updatedBy = req.user.id;
    await thread.save();

    res.status(201).json({
      thread: formatChatThread(thread),
      message: formatChatMessage(chatMessage)
    });
  } catch (error) {
    next(error);
  }
};

export const updateSupportThreadStatusAdmin = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid thread id' });
    }

    const { status } = req.body || {};
    const allowedStatuses = ['open', 'waiting_agent', 'waiting_customer', 'resolved', 'closed'];
    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({ message: 'Unsupported status value' });
    }

    const thread = await ChatThread.findById(id).populate('user', 'fullName phone country');
    if (!thread) {
      return res.status(404).json({ message: 'Support thread not found' });
    }

    thread.status = status === 'open' ? 'waiting_agent' : status;
    thread.updatedBy = req.user.id;
    await thread.save();

    res.json({ thread: formatChatThread(thread) });
  } catch (error) {
    next(error);
  }
};
