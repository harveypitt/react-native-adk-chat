# Copyright 2025 Google LLC
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

import datetime
import json
import os
import random
from zoneinfo import ZoneInfo

import google.auth
from google.adk.agents import Agent
from google.adk.apps.app import App

# Toggle AI-powered suggestions testing mode
# Set to True to enable diagnostic tools that ask questions and trigger AI suggestions
# Set to False for basic weather/time agent
ENABLE_SUGGESTIONS_TESTING = False

_, project_id = google.auth.default()
os.environ.setdefault("GOOGLE_CLOUD_PROJECT", project_id)
os.environ.setdefault("GOOGLE_CLOUD_LOCATION", "global")
os.environ.setdefault("GOOGLE_GENAI_USE_VERTEXAI", "True")


def get_weather(query: str) -> str:
    """Simulates a web search. Use it get information on weather.

    Args:
        query: A string containing the location to get weather information for.

    Returns:
        A string with the simulated weather information for the queried location.
    """
    if "sf" in query.lower() or "san francisco" in query.lower():
        return "It's 60 degrees and foggy."
    return "It's 90 degrees and sunny."


def get_current_time(query: str) -> str:
    """Simulates getting the current time for a city.

    Args:
        city: The name of the city to get the current time for.

    Returns:
        A string with the current time information.
    """
    if "sf" in query.lower() or "san francisco" in query.lower():
        tz_identifier = "America/Los_Angeles"
    else:
        return f"Sorry, I don't have timezone information for query: {query}."

    tz = ZoneInfo(tz_identifier)
    now = datetime.datetime.now(tz)
    return f"The current time for query {query} is {now.strftime('%Y-%m-%d %H:%M:%S %Z%z')}"


# Diagnostic tools for AI suggestions testing
# These return structured JSON data that triggers AI-powered suggestion generation

def get_equipment_state(equipment_id: str) -> str:
    """Gets the current state of equipment (for AI suggestions testing).

    Args:
        equipment_id: Equipment ID to check (e.g., "pump-1", "motor-2").

    Returns:
        JSON string with equipment state, temperature, alerts, etc.
    """
    states = [
        {"equipment_id": equipment_id, "status": "running", "state": "normal_operation",
         "temperature_celsius": 45.2, "pressure_psi": 120.0, "alerts": []},
        {"equipment_id": equipment_id, "status": "maintenance", "state": "maintenance_mode",
         "temperature_celsius": 25.0, "alerts": ["scheduled_maintenance"]},
        {"equipment_id": equipment_id, "status": "warning", "state": "high_temperature",
         "temperature_celsius": 78.5, "alerts": ["temperature_warning", "pressure_elevated"]},
        {"equipment_id": equipment_id, "status": "error", "state": "fault",
         "temperature_celsius": 95.0, "alerts": ["critical_fault"], "error_code": "E503"}
    ]
    return json.dumps(random.choice(states), indent=2)


def get_error_logs(equipment_id: str, hours: int = 24) -> str:
    """Gets recent error logs for equipment (for AI suggestions testing).

    Args:
        equipment_id: Equipment ID to check.
        hours: Hours to look back (default: 24).

    Returns:
        JSON string with error log entries.
    """
    errors = [
        {"code": "E404", "severity": "warning", "message": "Sensor timeout"},
        {"code": "E500", "severity": "error", "message": "System error"},
        {"code": "E503", "severity": "critical", "message": "Motor overheating"},
    ]
    logs = [{"timestamp": (datetime.datetime.now(ZoneInfo("UTC")) -
             datetime.timedelta(hours=i)).isoformat(), "equipment_id": equipment_id,
             **random.choice(errors)} for i in range(random.randint(0, 3))]
    return json.dumps({"equipment_id": equipment_id, "total_errors": len(logs),
                       "logs": logs}, indent=2)


# Configure agent based on suggestions testing mode
if ENABLE_SUGGESTIONS_TESTING:
    # Diagnostic mode - asks questions to trigger AI suggestions
    agent_instruction = """You are a diagnostic assistant helping troubleshoot equipment.

When users ask about equipment:
1. Call the appropriate diagnostic tool (get_equipment_state, get_error_logs)
2. After receiving tool results, ask a specific follow-up question based on the data
3. Reference actual values from the tool response in your question

Examples:
- "I see pump-1 is in {state}. What would you like to check next?"
- "The temperature is at {temp}°C. Is this normal for this equipment?"
- "I found {count} errors. Which one should we investigate?"

Always ask clear questions after calling tools to help guide troubleshooting."""

    agent_tools = [get_weather, get_current_time, get_equipment_state, get_error_logs]
else:
    # Basic mode - weather and time only
    agent_instruction = "You are a helpful AI assistant designed to provide accurate and useful information."
    agent_tools = [get_weather, get_current_time]

root_agent = Agent(
    name="root_agent",
    model="gemini-2.5-flash",
    instruction=agent_instruction,
    tools=agent_tools,
)

app = App(root_agent=root_agent, name="app")
