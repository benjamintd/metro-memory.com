'use client'

import { useConfig } from '@/lib/configContext'
import classNames from 'classnames'
import Image from 'next/image'
import { CircularProgressbar, buildStyles } from 'react-circular-progressbar'

const ProgressBars = ({
  foundStationsPerLine,
  stationsPerLine,
  minimized = false,
}: {
  foundStationsPerLine: Record<string, number>
  stationsPerLine: Record<string, number>
  minimized?: boolean
}) => {
  const { LINES, GAUGE_COLORS } = useConfig()
  return (
    <div
      className={classNames('grid gap-2 @container', {
        'grid-cols-[repeat(8,min-content)]': minimized,
        'grid-cols-2': !minimized,
      })}
    >
      {Object.keys(LINES).map((line) => {
        const title = `${LINES[line].name} - ${
          foundStationsPerLine[line] || 0
        }/${stationsPerLine[line]}`
        return (
          <div key={line} className="flex items-center gap-2">
            <div
              title={title}
              className="relative flex h-8 w-8 shrink-0 items-center justify-center"
            >
              <div className="absolute h-full w-full rounded-full shadow">
                <CircularProgressbar
                  background
                  backgroundPadding={2}
                  styles={buildStyles({
                    backgroundColor:
                      GAUGE_COLORS === 'inverted' ? 'white' : LINES[line].color,
                    pathColor:
                      GAUGE_COLORS === 'inverted'
                        ? LINES[line].color
                        : LINES[line].textColor,
                    trailColor: 'transparent',
                  })}
                  value={
                    (100 * (foundStationsPerLine[line] || 0)) /
                    stationsPerLine[line]
                  }
                />
              </div>
              <Image
                alt={line}
                src={`/images/${line}.svg`}
                width={64}
                height={64}
                className="z-20 h-6 w-6 rounded-full object-cover"
              />
            </div>
            {!minimized && (
              <p className="truncate whitespace-nowrap text-sm">{title}</p>
            )}
          </div>
        )
      })}
    </div>
  )
}

export default ProgressBars
