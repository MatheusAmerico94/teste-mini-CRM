// Node 24 on some Windows/OneDrive environments can fail in os.userInfo().
// tsx only needs a stable identifier for its temporary compilation directory.
if (typeof process.geteuid !== 'function') process.geteuid = () => 0;

