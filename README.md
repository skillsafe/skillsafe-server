# skillsafe-server

A local skill registry server for the [SkillSafe CLI](https://github.com/skillsafe/skillsafe-cli). Runs a lightweight Hono HTTP server that stores skills, blobs, scan reports, and verifications on the local filesystem — no cloud account required.

## Requirements

- Node.js 18+

## Start the Server

```bash
node dist/index.js
```

The server starts on `http://localhost:9876` by default, storing data in `./data`.

## Options

```
--port <number>     Port to listen on          (default: 9876)
--data <path>       Data directory             (default: ./data)
--token <string>    Require token for writes   (default: none — open)
--max-size <bytes>  Max request body size      (default: 52428800 = 50 MB)
--help              Show help
```

### Examples

```bash
# Default — open server on port 9876
node dist/index.js

# Custom port and data directory
node dist/index.js --port 9000 --data /var/skillsafe/data

# Require a token for all write operations (POST/PUT/PATCH/DELETE)
node dist/index.js --token mysecrettoken
```

When `--token` is set, write requests must include:

```
Authorization: Bearer mysecrettoken
```

Read requests (GET) are always open.

## Point the SkillSafe CLI at the Local Server

Pass `--api-base` to any command:

```bash
skillsafe --api-base http://localhost:9876 save ./my-skill
skillsafe --api-base http://localhost:9876 list
skillsafe --api-base http://localhost:9876 install @ns/name
```

## Data Layout

```
./data/
  @namespace/
    skill-name/
      skill.json              # Skill metadata
      versions/
        1.0.0/
          manifest.json       # Version manifest + file list
          scan_report.json    # Scan report (if uploaded)
          verification.json   # Verification result (if run)
          files/              # Symlinks (or copies) into .blobs/
  .agents/
    agt_xxxxx/
      agent.json              # Agent metadata
  .blobs/
    <xx>/
      <sha256-hex>            # Content-addressed blob store
```

## Routes

| Method | Path | Description |
|--------|------|-------------|
| GET | `/dashboard` | Web UI dashboard |
| GET | `/` | Redirect to dashboard |
| GET | `/v1/skills` | List all skills |
| GET | `/v1/skills/@ns/name` | Get skill metadata |
| POST | `/v1/skills/@ns/name` | Save a skill version |
| GET | `/v1/skills/@ns/name/versions` | List versions |
| GET | `/v1/skills/@ns/name/versions/:ver/download` | Download version archive |
| POST | `/v1/blobs` | Upload a blob |
| GET | `/v1/blobs/:hash` | Download a blob |
| POST | `/v1/skills/@ns/name/versions/:ver/scan` | Upload scan report |
| GET | `/v1/skills/@ns/name/versions/:ver/scan` | Get scan report |
| POST | `/v1/skills/@ns/name/versions/:ver/verify` | Run verification |
| GET | `/v1/skills/@ns/name/versions/:ver/verify` | Get verification result |
| POST | `/v1/skills/@ns/name/versions/:ver/yank` | Yank a version |
| POST | `/v1/agents` | Create agent |
| GET | `/v1/agents` | List agents |
| PATCH | `/v1/agents/:id` | Update agent |
| DELETE | `/v1/agents/:id` | Delete agent |
