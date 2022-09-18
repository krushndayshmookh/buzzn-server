const moment = require('moment-timezone')

const { User } = require('../models')

exports.users_get = async (req, res) => {
  const NOW = moment().tz('Asia/Kolkata')

  try {
    const usersOverMonth = await User.aggregate([
      // {
      //   $match: {
      //     createdAt: {
      //       $gte: NOW.clone().subtract(30, 'days').toDate(),
      //     },
      //   },
      // },
      {
        $group: {
          _id: {
            $dateToString: {
              format: '%Y-%m-%d',
              date: '$createdAt',
            },
          },
          count: {
            $sum: 1,
          },
        },
      },
      {
        $sort: {
          _id: 1,
        },
      },
      {
        $project: {
          _id: 0,
          date: '$_id',
          count: 1,
        },
      },
    ])

    // fill missing dates with 0
    const usersOverMonthFilled = []
    let lastDate = moment(usersOverMonth[0].date).startOf('day')
    for (let i = 0; i < 90; i++) {
      const date = lastDate.clone().format('YYYY-MM-DD')
      const user = usersOverMonth.find(u => u.date === date)
      usersOverMonthFilled.push({
        date,
        count: user ? user.count : 0,
      })
      lastDate = lastDate.clone().add(1, 'days')
    }

    return res.status(200).json(usersOverMonthFilled)
  } catch (err) {
    console.error({ err })
    return res.status(500).send({ err })
  }
}
