import { billNotificationsQueue } from "@/lib/queues/billNotifications.queue";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ path?: string[] }> }
) {
  const { path = [] } = await params;
  const pathname = path.join("/") || "index.html";

  // API endpoints
  if (pathname === "api/queues") {
    const counts = await billNotificationsQueue.getJobCounts();

    return NextResponse.json({
      queues: [
        {
          name: billNotificationsQueue.name,
          counts,
        },
      ],
    });
  }

  if (pathname === "api/tasks") {
    const tasks = await prisma.task.findMany({
      where: { status: "UNPAID" },
      include: { bill: true },
      orderBy: { dueDate: "asc" },
      take: 50,
    });

    return NextResponse.json({
      tasks: tasks.map((task) => ({
        id: task.id,
        vendor: task.bill.vendor,
        dueDate: task.dueDate,
        amount: Number(task.bill.amount),
      })),
    });
  }

  if (pathname.startsWith("api/queues/")) {
    const queueName = pathname.split("/")[2];

    if (queueName !== billNotificationsQueue.name) {
      return NextResponse.json({ error: "Queue not found" }, { status: 404 });
    }

    const [waiting, active, completed, failed, delayed] = await Promise.all([
      billNotificationsQueue.getWaiting(),
      billNotificationsQueue.getActive(),
      billNotificationsQueue.getCompleted(),
      billNotificationsQueue.getFailed(),
      billNotificationsQueue.getDelayed(),
    ]);

    return NextResponse.json({
      name: billNotificationsQueue.name,
      jobs: {
        waiting,
        active,
        completed,
        failed,
        delayed,
      },
      counts: await billNotificationsQueue.getJobCounts(),
    });
  }

  // Serve simple UI
  const html = `
<!DOCTYPE html>
<html>
<head>
  <title>Queue Monitor - Bill Notifications</title>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-gray-50">
  <div class="container mx-auto p-8">
    <h1 class="text-3xl font-bold mb-6 text-gray-900">Bill Notifications Queue Dashboard</h1>

    <!-- Manual Trigger Form -->
    <div class="bg-white rounded-lg shadow p-6 mb-6">
      <h2 class="text-xl font-semibold mb-4 text-gray-900">Manual Trigger</h2>
      <form id="triggerForm" class="space-y-4">
        <div>
          <label class="block text-sm font-medium mb-2 text-gray-700">Select Task</label>
          <select id="taskSelect" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900" required>
            <option value="">Loading tasks...</option>
          </select>
        </div>
        <div>
          <label class="block text-sm font-medium mb-2 text-gray-700">Notification Type</label>
          <select id="typeSelect" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900" required>
            <option value="DUE_TODAY">DUE_TODAY</option>
            <option value="DUE_SOON">DUE_SOON (1 day before)</option>
          </select>
        </div>
        <button
          type="submit"
          class="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:bg-gray-400"
        >
          Trigger Notification
        </button>
        <div id="triggerMessage" class="hidden mt-2"></div>
      </form>
    </div>

    <div id="queues" class="space-y-4"></div>
  </div>

  <script>
    // Load available tasks
    async function loadTasks() {
      const response = await fetch('/api/admin/queues/api/tasks');
      const data = await response.json();

      const taskSelect = document.getElementById('taskSelect');
      taskSelect.innerHTML = '<option value="">Select a task...</option>' +
        data.tasks.map(task => \`
          <option value="\${task.id}">
            \${task.vendor} - \${new Date(task.dueDate).toLocaleDateString()} - ฿\${task.amount.toFixed(2)}
          </option>
        \`).join('');
    }

    // Handle manual trigger form submission
    document.getElementById('triggerForm').addEventListener('submit', async (e) => {
      e.preventDefault();

      const taskId = document.getElementById('taskSelect').value;
      const type = document.getElementById('typeSelect').value;
      const messageDiv = document.getElementById('triggerMessage');

      if (!taskId) {
        messageDiv.className = 'mt-2 p-3 bg-red-100 text-red-700 rounded';
        messageDiv.textContent = 'Please select a task';
        messageDiv.classList.remove('hidden');
        return;
      }

      try {
        const response = await fetch('/api/admin/queues/api/trigger', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ taskId, type })
        });

        const result = await response.json();

        if (response.ok) {
          messageDiv.className = 'mt-2 p-3 bg-green-100 text-green-700 rounded';
          messageDiv.textContent = result.message + ' (Job ID: ' + result.jobId + ')';
          // Reload queues to show new job
          loadQueues();
        } else {
          messageDiv.className = 'mt-2 p-3 bg-red-100 text-red-700 rounded';
          messageDiv.textContent = 'Error: ' + result.error;
        }
        messageDiv.classList.remove('hidden');

        // Hide message after 5 seconds
        setTimeout(() => {
          messageDiv.classList.add('hidden');
        }, 5000);
      } catch (error) {
        messageDiv.className = 'mt-2 p-3 bg-red-100 text-red-700 rounded';
        messageDiv.textContent = 'Error triggering job: ' + error.message;
        messageDiv.classList.remove('hidden');
      }
    });

    async function loadQueues() {
      const response = await fetch('/api/admin/queues/api/queues');
      const data = await response.json();

      const queuesDiv = document.getElementById('queues');
      queuesDiv.innerHTML = data.queues.map(queue => \`
        <div class="bg-white rounded-lg shadow p-6">
          <h2 class="text-xl font-semibold mb-4 text-gray-900">\${queue.name}</h2>
          <div class="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div class="text-center p-4 bg-blue-50 rounded">
              <div class="text-2xl font-bold text-blue-600">\${queue.counts.waiting || 0}</div>
              <div class="text-sm text-gray-600">Waiting</div>
            </div>
            <div class="text-center p-4 bg-yellow-50 rounded">
              <div class="text-2xl font-bold text-yellow-600">\${queue.counts.active || 0}</div>
              <div class="text-sm text-gray-600">Active</div>
            </div>
            <div class="text-center p-4 bg-green-50 rounded">
              <div class="text-2xl font-bold text-green-600">\${queue.counts.completed || 0}</div>
              <div class="text-sm text-gray-600">Completed</div>
            </div>
            <div class="text-center p-4 bg-red-50 rounded">
              <div class="text-2xl font-bold text-red-600">\${queue.counts.failed || 0}</div>
              <div class="text-sm text-gray-600">Failed</div>
            </div>
            <div class="text-center p-4 bg-purple-50 rounded">
              <div class="text-2xl font-bold text-purple-600">\${queue.counts.delayed || 0}</div>
              <div class="text-sm text-gray-600">Delayed</div>
            </div>
          </div>
          <button
            onclick="loadQueueDetails('\${queue.name}')"
            class="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            View Details
          </button>
          <div id="details-\${queue.name}" class="mt-4 hidden"></div>
        </div>
      \`).join('');
    }

    async function loadQueueDetails(queueName) {
      const response = await fetch(\`/api/admin/queues/api/queues/\${queueName}\`);
      const data = await response.json();

      const detailsDiv = document.getElementById(\`details-\${queueName}\`);
      detailsDiv.classList.remove('hidden');
      detailsDiv.innerHTML = \`
        <h3 class="font-semibold mb-2 text-gray-900">Recent Jobs</h3>
        <div class="space-y-2">
          \${Object.entries(data.jobs).map(([status, jobs]) => \`
            <details class="border rounded p-2">
              <summary class="cursor-pointer font-medium capitalize text-gray-900">\${status} (\${jobs.length})</summary>
              <div class="mt-2 space-y-2">
                \${jobs.slice(0, 10).map(job => \`
                  <div class="text-sm bg-gray-50 p-2 rounded">
                    <div class="text-gray-900"><strong>ID:</strong> \${job.id}</div>
                    <div class="text-gray-900"><strong>Data:</strong> <pre class="text-xs text-gray-800">\${JSON.stringify(job.data, null, 2)}</pre></div>
                    \${job.failedReason ? \`<div class="text-red-600"><strong>Error:</strong> \${job.failedReason}</div>\` : ''}
                  </div>
                \`).join('')}
              </div>
            </details>
          \`).join('')}
        </div>
      \`;
    }

    // Auto-refresh every 5 seconds
    setInterval(loadQueues, 5000);
    loadQueues();
    loadTasks();
  </script>
</body>
</html>
  `;

  return new NextResponse(html, {
    headers: {
      "Content-Type": "text/html",
    },
  });
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ path?: string[] }> }
) {
  const { path = [] } = await params;
  const pathname = path.join("/");

  // Manual trigger endpoint (keep existing functionality)
  if (pathname === "api/trigger") {
    const body = await request.json();
    const { taskId, type } = body;

    if (!taskId || !type) {
      return NextResponse.json(
        { error: "taskId and type are required" },
        { status: 400 }
      );
    }

    if (type !== "DUE_SOON" && type !== "DUE_TODAY") {
      return NextResponse.json(
        { error: "type must be DUE_SOON or DUE_TODAY" },
        { status: 400 }
      );
    }

    // Verify task exists
    const task = await prisma.task.findUnique({
      where: { id: taskId },
    });

    if (!task) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    // Add job to queue immediately (no delay)
    const job = await billNotificationsQueue.add(
      { taskId, type },
      {
        jobId: `manual-${type.toLowerCase()}-${taskId}-${Date.now()}`,
      }
    );

    return NextResponse.json({
      success: true,
      jobId: job.id,
      message: `Job queued successfully for task ${taskId}`,
    });
  }

  return NextResponse.json({ error: "Invalid endpoint" }, { status: 404 });
}
