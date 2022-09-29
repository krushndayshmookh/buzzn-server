const axios = require('axios')
const performDatabaseUpdate = require('../../performDatabaseUpdate')

const { Post } = require('../../../models')

async function run() {
  try {
    const posts = await Post.find({
      type: 'image'
    })
    
    console.info(`Found ${posts.length} posts.`)

    for (let i = 0; i < posts.length; i++) {
      setTimeout(async () => {
        const post = posts[i]
        try {
          await axios.post(
            `https://processing.keepbuzzn.com/process/post/${post.type}`,
            {
              post: post._id,
            }
          )
        } catch (err) {
          console.error('Error processing post', post._id, post.type)
        }

        console.info(`Queued ${i + 1}/${posts.length}`)
      }, 100 * i)
    }
  } catch (err) {
    console.error(err)
  }
}

const main = async () => {
  await performDatabaseUpdate(run)
}

main()
