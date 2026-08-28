// Replace arrow functions returning res directly:
// BAD:  (req, res) => res.json(...)
// GOOD: (_req, res) => { res.json(...); }

router.get("/admin/stats", async (_req, res) => {
  try {
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
});
export default router;
