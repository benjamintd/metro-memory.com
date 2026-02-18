import barcelona from '@/app/(game)/barcelona/opengraph-image.jpg'
import berlin from '@/app/(game)/berlin/opengraph-image.jpg'
import boston from '@/app/(game)/boston/opengraph-image.jpg'
import budapest from '@/app/(game)/budapest/opengraph-image.jpg'
import chicago from '@/app/(game)/chicago/opengraph-image.jpg'
import dc from '@/app/(game)/dc/opengraph-image.jpg'
import dresden from '@/app/(game)/dresden/opengraph-image.jpg'
import hamburg from '@/app/(game)/hamburg/opengraph-image.jpg'
import helsinki from '@/app/(game)/helsinki/opengraph-image.jpg'
import istanbul from '@/app/(game)/istanbul/opengraph-image.jpg'
import karlsruhe from '@/app/(game)/karlsruhe/opengraph-image.jpg'
import london from '@/app/(game)/london/opengraph-image.jpg'
import madrid from '@/app/(game)/madrid/opengraph-image.jpg'
import mexicoCity from '@/app/(game)/mexico-city/opengraph-image.jpg'
import montreal from '@/app/(game)/montreal/opengraph-image.jpg'
import muenchen from '@/app/(game)/muenchen/opengraph-image.jpg'
import ny from '@/app/(game)/ny/opengraph-image.jpg'
import paris from '@/app/(game)/paris/opengraph-image.jpg'
import potsdam from '@/app/(game)/potsdam/opengraph-image.jpg'
import seoul from '@/app/(game)/seoul/opengraph-image.jpg'
import singapore from '@/app/(game)/singapore/opengraph-image.jpg'
import stockholm from '@/app/(game)/stockholm/opengraph-image.jpg'
import tokyo from '@/app/(game)/tokyo/opengraph-image.jpg'
import toulouse from '@/app/(game)/toulouse/opengraph-image.jpg'
import wien from '@/app/(game)/wien/opengraph-image.jpg'

import { StaticImageData } from 'next/image'

export interface ICity {
  name: string
  image: StaticImageData
  link: string
  disabled?: boolean
  hideInStats?: boolean
}

export const cities: ICity[] = [
  {
    name: 'Paris',
    image: paris,
    link: 'https://memory.pour.paris',
  },
  {
    name: 'London',
    image: london,
    link: '/london',
  },
  {
    name: 'Berlin',
    image: berlin,
    link: '/berlin',
  },
  {
    name: 'Vienna',
    image: wien,
    link: '/wien',
  },
  {
    name: 'Washington DC',
    image: dc,
    link: '/dc',
  },
  {
    name: 'Madrid',
    image: madrid,
    link: '/madrid',
  },
  {
    name: 'Barcelona',
    image: barcelona,
    link: '/barcelona',
  },
  {
    name: 'Seoul',
    image: seoul,
    link: '/seoul',
  },
  {
    name: 'Mexico City',
    image: mexicoCity,
    link: '/mexico-city',
  },
  {
    name: 'New York Subway',
    image: ny,
    link: '/ny',
  },
  {
    name: 'Istanbul',
    image: istanbul,
    link: '/istanbul',
  },
  {
    name: 'Tokyo',
    image: tokyo,
    link: '/tokyo',
  },
  {
    name: 'Stockholm',
    image: stockholm,
    link: '/stockholm',
  },
  {
    name: 'Singapore',
    image: singapore,
    link: '/singapore',
  },
  {
    name: 'Montréal',
    image: montreal,
    link: '/montreal',
  },
  {
    name: 'Chicago',
    image: chicago,
    link: '/chicago',
  },
  {
    name: 'Boston',
    image: boston,
    link: '/boston',
  },
  {
    name: 'Hamburg',
    image: hamburg,
    link: '/hamburg',
  },
  {
    name: 'München',
    image: muenchen,
    link: '/muenchen',
  },
  {
    name: 'Potsdam',
    image: potsdam,
    link: '/potsdam',
  },
  {
    name: 'Karlsruhe',
    image: karlsruhe,
    link: '/karlsruhe',
  },
  {
    name: 'Dresden',
    image: dresden,
    link: '/dresden',
  },
  {
    name: 'Budapest',
    image: budapest,
    link: '/budapest',
  },
  {
    name: 'Helsinki',
    image: helsinki,
    link: '/helsinki',
  },
  {
    name: 'Toulouse',
    image: toulouse,
    link: '/toulouse',
  },
  // {
  //   name: 'Vancouver',
  //   image: vancouver,
  //   link: '/vancouver',
  // },
]
