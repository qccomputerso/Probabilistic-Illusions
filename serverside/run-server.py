import daemon
import asyncio
from app import main

with daemon.DaemonContext():
    asyncio.run(main())
