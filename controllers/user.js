const User = require('../models/user').model

const supabase = require('../supabase')

exports.list_get = async (req, res) => {
  const { type } = req.query

  let query = {}

  if (type) {
    query.type = type
  }

  try {
    const { data, error } = await supabase.from('profiles').select('*')
    if (error) throw error
    return res.send(data)
  } catch (err) {
    console.error({ err })
    return res.status(500).send({ err })
  }
}

exports.details_get = (req, res) => {
  const { userid } = req.params

  let query = {
    _id: userid
  }

  User.findOne(query)
    .select('-password')
    .lean()
    .then(doc => {
      return res.send(doc)
    })
    .catch(err => {
      console.error({ err })
      return res.status(500).send({ err })
    })
}

exports.create_post = (req, res) => {
  const { name, email, password, type } = req.body

  let newUser = new User({
    name,
    email,
    password,
    type
  })

  newUser
    .save()
    .then(doc => {
      return res.send(doc)
    })
    .catch(err => {
      console.error({ err })
      return res.status(500).send({ err })
    })
}

exports.delete_delete = async (req, res) => {
  const { userid } = req.params

  let query = {
    _id: userid
  }

  User.deleteOne(query)
    .then(doc => {
      return res.send(doc)
    })
    .catch(err => {
      console.error({ err })
      return res.status(500).send({ err })
    })
}
