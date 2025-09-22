'use client'

import { Fragment, useState } from 'react'
import Link from 'next/link'
import { Dialog, Transition, Menu } from '@headlessui/react'
import { Menu as MenuIcon, X } from 'lucide-react'

export default function GlobalMenu() {
  const [open, setOpen] = useState(false)

  return (
    <>
      {/* bouton burger mobile (dark glass) */}
      <button
        onClick={() => setOpen(true)}
        className="fixed top-3 left-3 z-50 rounded-md border border-white/10 bg-neutral-900/70 p-2 backdrop-blur hover:bg-neutral-900/80 md:hidden"
        aria-label="Ouvrir le menu"
      >
        <MenuIcon className="h-6 w-6 text-neutral-100" />
      </button>

      {/* dropdown desktop (dark) */}
      <div className="hidden md:block fixed top-3 left-3 z-50">
        <Menu as="div" className="relative inline-block text-left">
          <Menu.Button className="rounded-md border border-white/10 bg-neutral-900/70 px-3 py-1.5 text-neutral-100 backdrop-blur hover:bg-neutral-900/80">
            Menu
          </Menu.Button>
          <Transition
            as={Fragment}
            enter="transition ease-out duration-100"
            enterFrom="transform opacity-0 scale-95"
            enterTo="transform opacity-100 scale-100"
            leave="transition ease-in duration-75"
            leaveFrom="transform opacity-100 scale-100"
            leaveTo="transform opacity-0 scale-95"
          >
            <Menu.Items className="absolute mt-2 w-44 origin-top-left overflow-hidden rounded-md border border-white/10 bg-neutral-900 text-neutral-100 shadow-xl ring-1 ring-black/20 focus:outline-none">
              <div className="p-1 flex flex-col">
                <Menu.Item>
                  {({ active }) => (
                    <Link
                      href="/timeline"
                      className={`px-3 py-2 rounded ${
                        active ? 'bg-neutral-800' : ''
                      }`}
                    >
                      Timeline
                    </Link>
                  )}
                </Menu.Item>
                <Menu.Item>
                  {({ active }) => (
                    <Link
                      href="/explore"
                      className={`px-3 py-2 rounded ${
                        active ? 'bg-neutral-800' : ''
                      }`}
                    >
                      Explore
                    </Link>
                  )}
                </Menu.Item>
              </div>
            </Menu.Items>
          </Transition>
        </Menu>
      </div>

      {/* drawer mobile (dark) */}
      <Transition show={open} as={Fragment}>
        <Dialog
          as="div"
          className="relative z-[60] md:hidden"
          onClose={setOpen}
        >
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-200"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-150"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" />
          </Transition.Child>

          <div className="fixed inset-0 flex">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-200"
              enterFrom="-translate-x-full"
              enterTo="translate-x-0"
              leave="ease-in duration-150"
              leaveFrom="translate-x-0"
              leaveTo="-translate-x-full"
            >
              <Dialog.Panel className="relative w-64 max-w-full bg-neutral-950 text-neutral-100 border-r border-white/10 p-4 shadow-2xl">
                <button
                  onClick={() => setOpen(false)}
                  className="absolute top-3 right-3 p-1 rounded-md hover:bg-neutral-900"
                  aria-label="Fermer le menu"
                >
                  <X className="h-6 w-6" />
                </button>

                <nav className="mt-10 flex flex-col gap-4 text-lg">
                  <Link
                    href="/timeline"
                    onClick={() => setOpen(false)}
                    className="hover:text-white"
                  >
                    Timeline
                  </Link>
                  <Link
                    href="/explore"
                    onClick={() => setOpen(false)}
                    className="hover:text-white"
                  >
                    Explore
                  </Link>
                </nav>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </Dialog>
      </Transition>
    </>
  )
}
