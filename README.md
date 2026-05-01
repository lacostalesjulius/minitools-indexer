# minitools-indexer
Front-end + gate proxying of server-side services. Checking of health of services and announces their uptime and online status.

# Stack
- Vanilla JS, CSS and HTML5
- SPA design
- Region-based hydration.

# Usage
## Gate and Frontend can be run via:
- 'npm run dev:frontend' and 'npm run dev:gate' respectively.
- proxying via NGINX is required to bypass CORS issue as no headers are added to allow X-Origin use.
- front end must be routed to '/' and gate into '/api'.
- Note the need to add upgrade header for WSS as the frontend uses it for status checks for service uptime.

## Services to Gate can be done by:
- Services must use '/heartbeat' of the gate if they are in the same local server; or 
- Services must use '/api/heartbeat' on the expose NGINX server if not.
- Use the Function on './models/aggregator.js' to see the json contract needed to announce online status.
- After which, the gate will reverse proxy any request it receives on '/api/[service id]/' on that service.
- The frontend for that service must still be made.
