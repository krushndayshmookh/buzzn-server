const axios = require('axios')

const performDatabaseUpdate = require('../performDatabaseUpdate')

const { PROCESSING_SERVER_URL } = process.env

const { Post } = require('../../models')

async function run() {
  try {
    // fetch posts
    const posts = await Post.find({ type: 'image' })

    // set count to 0
    let count = 0

    // loop over each post and check their image server
    for (let i = 0; i < posts.length; i++) {
      const post = posts[i]

      const imageURL = post.content.image.content

      if (!imageURL || !imageURL.includes('https')) {
        await post.delete()
      } else if (!imageURL.includes('cdn')) {
        post.content.image.original = imageURL
        await post.save()

        axios
          .post(`${PROCESSING_SERVER_URL}/api/process/post/image`, {
            post: post._id,
          })
          .catch(console.error)
        count++
      }
    }

    console.info(`${count}/${posts.length} posts processed`)
    console.info('done')
  } catch (err) {
    console.error(err)
  }
}

const main = async () => {
  await performDatabaseUpdate(run)
}

main()
