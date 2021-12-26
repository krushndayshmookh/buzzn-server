const supabase = require('../supabase')

exports.create_post = async (req, res) => {
  const { record } = req.body

  const blockCount = {
    text: 20,
    image: 50,
  }[record.type]

  try {
    const { data: instrument } = await supabase
      .from('instruments')
      .select('*')
      .eq('id', record.user_id)
      .single()

    let update = {}

    if (!instrument) {
      update = {
        id: record.user_id,
        minted: blockCount,
      }
    } else {
      update = {
        id: record.user_id,
        minted: instrument.minted + blockCount,
      }
    }

    const { data: updated } = await supabase.from('instruments').upsert(
      update,
      {
        returning: 'minimal',
      }
    )

    await supabase.from('block_delta').insert({
      user_id: record.user_id,
      instrument_id: record.user_id,
      type: 'mint',
      data: {
        post_id: record.id,
      },
      quantity: blockCount,
    })

    return res.status(201).send(updated)
  } catch (err) {
    console.error({ err })
    return res.status(500).send({ err })
  }
}
