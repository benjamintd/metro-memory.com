import { Suspense } from 'react'
import { getTweet } from 'react-tweet/api'
import { type TweetProps, TweetNotFound, TweetSkeleton } from 'react-tweet'

import {
  type TwitterComponents,
  type EnrichedTweet,
  TweetHeader,
  TweetInReplyTo,
  TweetBody,
  TweetInfo,
  enrichTweet,
} from 'react-tweet'

type Props = {
  tweet: EnrichedTweet
  components?: TwitterComponents
}

export const MyTweet = ({ tweet, components }: Props) => {
  return (
    <figure className="mb-4 break-inside-avoid rounded-2xl border px-4 py-6">
      <TweetHeader tweet={tweet} components={components} />
      {tweet.in_reply_to_status_id_str && <TweetInReplyTo tweet={tweet} />}
      <TweetBody tweet={tweet} />
      <hr className="my-3" />
      <TweetInfo tweet={tweet} />
    </figure>
  )
}

const TweetContent = async ({ id, components, onError }: TweetProps) => {
  let enriched: EnrichedTweet | undefined

  try {
    const tweet = id ? await getTweet(id) : undefined
    // enrichTweet can throw on malformed/partial API responses (e.g. when the
    // tweet endpoint is rate-limited at build time), so keep it inside the try.
    if (tweet) {
      enriched = enrichTweet(tweet)
    }
  } catch (err) {
    if (onError) {
      onError(err)
    } else {
      console.error(err)
    }
  }

  if (!enriched) {
    const NotFound = components?.TweetNotFound || TweetNotFound
    return <NotFound />
  }

  return <MyTweet tweet={enriched} components={components} />
}

export const Tweet = ({
  fallback = <TweetSkeleton />,
  ...props
}: TweetProps) => (
  <Suspense fallback={fallback}>
    <TweetContent {...props} />
  </Suspense>
)

export default Tweet
