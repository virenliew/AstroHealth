# AstroHealth: a health monitoring software for astronauts

## Description
AstroHealth is an application that monitors astronauts' health in real time. We developed a web app that monitors health vitals from an astronaut and send that vitals  to Mission Control. Communication of Astronauts in deep space faces latency, so our solution works by establishing a WebSocket connection to Mission Control.

## Setup
To setting up a server, you need:
- Server software
- Python 3.13 or higher

## Using Python tools
Navigate to `ws-utils/`.You will find 2 files that supports the NASA Space Apps Challenge.
- `ws_healthdevice.py` - Health device simulation
- `ws_mission_control.py` - Mission Control simulation

Before using, make sure that you have websockets installed:
```bash
pip install -r requirements.txt
```

## Credits
- Our exercise interface uses NASA-STD-3001 data to determine the exercise type and rate.
- We also used OCHMO-STD-100.1A to determine the normal health vitals on an astronaut.
- We also used Spaceflight Standard Measures to track the approriate sleep durations of astronauts with a form.