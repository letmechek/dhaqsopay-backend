import { ChatThread } from '../models/ChatThread.js';
import { ChatMessage } from '../models/ChatMessage.js';
import { formatChatMessage, formatChatThread } from '../utils/serializers.js';

const sanitizeMessage = value => {
  if (typeof value !== 'string') return '';
  return value.trim();
};

const sanitizeSubject = value => {
  if (typeof value !== 'string') return 'Support chat';
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : 'Support chat';
};

const ensureThreadForUser = async ({ userId, subject }) => {
  let thread = await ChatThread.findOne({ user: userId });
  if (thread) {
    return thread;
  }

  thread = await ChatThread.create({
    user: userId,
    subject: sanitizeSubject(subject),
    status: 'waiting_agent',
    lastSender: 'customer',
    messagesCount: 0
  });

  return thread;
};

export const getSupportThread = async (req, res, next) => {
  try {
    const thread = await ChatThread.findOne({ user: req.user.id });
    if (!thread) {
      return res.json({ thread: null, messages: [] });
    }

    const messages = await ChatMessage.find({ thread: thread.id })
      .sort({ createdAt: 1 })
      .limit(200);

    res.json({
      thread: formatChatThread(thread),
      messages: messages.map(formatChatMessage)
    });
  } catch (error) {
    next(error);
  }
};

export const postSupportMessage = async (req, res, next) => {
  try {
    const message = sanitizeMessage(req.body?.message);
    const subject = sanitizeSubject(req.body?.subject);

    if (!message) {
      return res.status(400).json({ message: 'Message is required' });
    }

    const thread = await ensureThreadForUser({ userId: req.user.id, subject });

    const chatMessage = await ChatMessage.create({
      thread: thread.id,
      senderType: 'customer',
      sender: req.user.id,
      body: message
    });

    thread.lastMessageAt = chatMessage.createdAt;
    thread.lastMessageSnippet = message.slice(0, 280);
    thread.lastSender = 'customer';
    thread.status = 'waiting_agent';
    thread.messagesCount = (thread.messagesCount ?? 0) + 1;
    thread.updatedBy = req.user.id;
    if (!thread.subject) {
      thread.subject = subject;
    }
    await thread.save();

    res.status(201).json({
      thread: formatChatThread(thread),
      message: formatChatMessage(chatMessage)
    });
  } catch (error) {
    next(error);
  }
};

export const updateSupportThreadStatus = async (req, res, next) => {
  try {
    const { status } = req.body || {};
    const allowedStatuses = ['waiting_agent', 'resolved', 'closed', 'open'];
    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({ message: 'Unsupported status value' });
    }

    const thread = await ChatThread.findOne({ user: req.user.id });
    if (!thread) {
      return res.status(404).json({ message: 'Support thread not found' });
    }

    let nextStatus = status;
    if (status === 'open') {
      nextStatus = 'waiting_agent';
    }

    thread.status = nextStatus;
    thread.updatedBy = req.user.id;
    await thread.save();

    res.json({ thread: formatChatThread(thread) });
  } catch (error) {
    next(error);
  }
};
