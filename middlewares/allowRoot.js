const allowRoot = async (req, res, next) => {
  // eslint-disable-next-line no-unsafe-optional-chaining
  const user = req.decoded?.user
  const { overrideKey } = req.query

  if (overrideKey === process.env.OVERRIDE_KEY || user?.type === 'root') {
    next()
  } else {
    const result = {
      error: 'Authentication error. Access forbidden.',
      status: 403,
    }
    res.status(403).send(result)
  }
}

module.exports = allowRoot
