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
    <div class="flex items-center justify-between mb-6">
      <h1 class="text-3xl font-bold text-gray-900">Bill Notifications Queue Dashboard</h1>
      <button
        onclick="refreshData()"
        class="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center gap-2"
      >
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
        Refresh
      </button>
    </div>

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
          <div class="mt-4 flex flex-wrap gap-2">
            <button
              onclick="loadQueueDetails('\${queue.name}')"
              class="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              View Details
            </button>
            \${queue.counts.delayed > 0 ? \`
              <button
                onclick="triggerAllDelayed()"
                class="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700"
              >
                Trigger All Delayed (\${queue.counts.delayed})
              </button>
            \` : ''}
            \${queue.counts.failed > 0 ? \`
              <button
                onclick="deleteAllFailed()"
                class="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
              >
                Delete All Failed (\${queue.counts.failed})
              </button>
            \` : ''}
            \${queue.counts.completed > 0 ? \`
              <button
                onclick="deleteAllCompleted()"
                class="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
              >
                Delete All Completed (\${queue.counts.completed})
              </button>
            \` : ''}
          </div>
          <div id="details-\${queue.name}" class="mt-4 hidden"></div>
        </div>
      \`).join('');
    }

    async function triggerDelayedJob(jobId) {
      if (!confirm('Are you sure you want to trigger this delayed job now?')) {
        return;
      }

      try {
        const response = await fetch('/api/admin/queues/api/trigger-delayed', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ jobId })
        });

        const result = await response.json();

        if (response.ok) {
          alert('Job triggered successfully!');
          loadQueues();
        } else {
          alert('Error: ' + result.error);
        }
      } catch (error) {
        alert('Error triggering job: ' + error.message);
      }
    }

    async function deleteJob(jobId) {
      if (!confirm('Are you sure you want to delete this job? This action cannot be undone.')) {
        return;
      }

      try {
        const response = await fetch('/api/admin/queues/api/delete-job', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ jobId })
        });

        const result = await response.json();

        if (response.ok) {
          alert('Job deleted successfully!');
          loadQueues();
        } else {
          alert('Error: ' + result.error);
        }
      } catch (error) {
        alert('Error deleting job: ' + error.message);
      }
    }

    async function deleteAllFailed() {
      if (!confirm('Are you sure you want to delete ALL failed jobs? This action cannot be undone.')) {
        return;
      }

      try {
        const response = await fetch('/api/admin/queues/api/delete-failed', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' }
        });

        const result = await response.json();

        if (response.ok) {
          alert(\`Successfully deleted \${result.count} failed jobs!\`);
          loadQueues();
        } else {
          alert('Error: ' + result.error);
        }
      } catch (error) {
        alert('Error deleting jobs: ' + error.message);
      }
    }

    async function deleteAllCompleted() {
      if (!confirm('Are you sure you want to delete ALL completed jobs? This action cannot be undone.')) {
        return;
      }

      try {
        const response = await fetch('/api/admin/queues/api/delete-completed', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' }
        });

        const result = await response.json();

        if (response.ok) {
          alert(\`Successfully deleted \${result.count} completed jobs!\`);
          loadQueues();
        } else {
          alert('Error: ' + result.error);
        }
      } catch (error) {
        alert('Error deleting jobs: ' + error.message);
      }
    }

    async function triggerAllDelayed() {
      if (!confirm('Are you sure you want to trigger ALL delayed jobs now?')) {
        return;
      }

      try {
        const response = await fetch('/api/admin/queues/api/trigger-all-delayed', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' }
        });

        const result = await response.json();

        if (response.ok) {
          alert(\`Successfully triggered \${result.count} delayed jobs!\`);
          loadQueues();
        } else {
          alert('Error: ' + result.error);
        }
      } catch (error) {
        alert('Error triggering jobs: ' + error.message);
      }
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
                    <div class="mt-2 flex gap-2">
                      \${status === 'delayed' ? \`
                        <button
                          onclick="triggerDelayedJob('\${job.id}')"
                          class="px-3 py-1 bg-purple-600 text-white text-xs rounded hover:bg-purple-700"
                        >
                          Trigger Now
                        </button>
                      \` : ''}
                      <button
                        onclick="deleteJob('\${job.id}')"
                        class="px-3 py-1 bg-red-600 text-white text-xs rounded hover:bg-red-700"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                \`).join('')}
              </div>
            </details>
          \`).join('')}
        </div>
      \`;
    }

    // Manual refresh button
    function refreshData() {
      loadQueues();
      loadTasks();
    }

    // Initial load
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

  // Trigger delayed job endpoint
  if (pathname === "api/trigger-delayed") {
    const body = await request.json();
    const { jobId } = body;

    if (!jobId) {
      return NextResponse.json(
        { error: "jobId is required" },
        { status: 400 }
      );
    }

    try {
      // Get the job
      const job = await billNotificationsQueue.getJob(jobId);

      if (!job) {
        return NextResponse.json({ error: "Job not found" }, { status: 404 });
      }

      // Promote the delayed job to be processed immediately
      await job.promote();

      return NextResponse.json({
        success: true,
        jobId: job.id,
        message: `Delayed job ${jobId} triggered successfully`,
      });
    } catch (error) {
      return NextResponse.json(
        {
          error: error instanceof Error ? error.message : "Failed to trigger job",
        },
        { status: 500 }
      );
    }
  }

  // Trigger all delayed jobs endpoint
  if (pathname === "api/trigger-all-delayed") {
    try {
      const delayedJobs = await billNotificationsQueue.getDelayed();

      let count = 0;
      for (const job of delayedJobs) {
        await job.promote();
        count++;
      }

      return NextResponse.json({
        success: true,
        count,
        message: `Successfully triggered ${count} delayed jobs`,
      });
    } catch (error) {
      return NextResponse.json(
        {
          error:
            error instanceof Error ? error.message : "Failed to trigger jobs",
        },
        { status: 500 }
      );
    }
  }

  // Delete individual job endpoint
  if (pathname === "api/delete-job") {
    const body = await request.json();
    const { jobId } = body;

    if (!jobId) {
      return NextResponse.json(
        { error: "jobId is required" },
        { status: 400 }
      );
    }

    try {
      const job = await billNotificationsQueue.getJob(jobId);

      if (!job) {
        return NextResponse.json({ error: "Job not found" }, { status: 404 });
      }

      await job.remove();

      return NextResponse.json({
        success: true,
        jobId: job.id,
        message: `Job ${jobId} deleted successfully`,
      });
    } catch (error) {
      return NextResponse.json(
        {
          error: error instanceof Error ? error.message : "Failed to delete job",
        },
        { status: 500 }
      );
    }
  }

  // Delete all failed jobs endpoint
  if (pathname === "api/delete-failed") {
    try {
      const failedJobs = await billNotificationsQueue.getFailed();

      let count = 0;
      for (const job of failedJobs) {
        await job.remove();
        count++;
      }

      return NextResponse.json({
        success: true,
        count,
        message: `Successfully deleted ${count} failed jobs`,
      });
    } catch (error) {
      return NextResponse.json(
        {
          error:
            error instanceof Error ? error.message : "Failed to delete jobs",
        },
        { status: 500 }
      );
    }
  }

  // Delete all completed jobs endpoint
  if (pathname === "api/delete-completed") {
    try {
      const completedJobs = await billNotificationsQueue.getCompleted();

      let count = 0;
      for (const job of completedJobs) {
        await job.remove();
        count++;
      }

      return NextResponse.json({
        success: true,
        count,
        message: `Successfully deleted ${count} completed jobs`,
      });
    } catch (error) {
      return NextResponse.json(
        {
          error:
            error instanceof Error ? error.message : "Failed to delete jobs",
        },
        { status: 500 }
      );
    }
  }

  return NextResponse.json({ error: "Invalid endpoint" }, { status: 404 });
}
