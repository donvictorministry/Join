/* Prayer House - content.js
 * =====================================================================
 *  ALL the words on the info pages live in this one file.
 *  Edit, save, publish. No other file needs to change.
 *
 *  HOW TO EDIT (works fine on a phone)
 *  1. Change only the text. Keep the backticks ` around every block.
 *  2. Never type a backtick inside your own text.
 *  3. Page text uses a tiny format:
 *       ## Heading        starts a new card
 *       a normal line     is a paragraph (a blank line starts a new one)
 *       - item            is a bullet
 *       > quote           is a scripture card; finish it with  > — Source
 *  4. Photos: paste your image link between the backticks after photo:
 *  5. Contact buttons: put your real links under links:
 *
 *  Contact Us, Partner With Us, Our Aims, How to Use and Terms of Use can
 *  also be edited live from the Admin Control Center > Pages tab. Whatever
 *  is saved there replaces the cards below (the top banner stays).
 * =====================================================================
 */
(function (w) {
  'use strict';
  var DV = (w.DV = w.DV || {});

  DV.content = {

    /* ---------- CONTACT BUTTONS: replace each REPLACE... with your real link ---------- */
    links: {
      gmail: `mailto:REPLACE@example.com`,
      whatsapp: `https://wa.me/REPLACE_NUMBER`,
      phone: `tel:+REPLACE_NUMBER`,
      facebook: `https://www.facebook.com/REPLACE_PAGE`
    },

    /* ---------- ABOUT THE FOUNDER ---------- */
    founder: {
      photo: `https://REPLACE-WITH-YOUR-PHOTO-URL/founder.jpg`,
      name: `Founder Name`,
      role: `Founder and Director`,
      bio: `Prayer House began with a simple conviction: no one should have to carry a burden alone. Prayer was never meant to be private and lonely. It was meant to be shared. This app is my way of putting that conviction into your hands, so that a need shared at midnight can be met with prayer by morning. Everything here is built with one hope: that you would feel God's nearness through the prayers of His people.`,
      text: `
## My vision
I long to see a community where a need shared at midnight is met with prayer by morning. Prayer House is a simple tool for that: a wall where requests are lifted up, a chain of people who pray, and a place to celebrate when God answers.

## What I believe about prayer
- Prayer is a conversation with a Father who listens.
- Prayer is stronger when it is shared.
- Quiet prayers are heard as clearly as loud ones.
- Every answered prayer is worth celebrating out loud.

## A word to you
> Confess your faults one to another, and pray one for another, that ye may be healed. The effectual fervent prayer of a righteous man availeth much.
> — James 5:16 (KJV)

## Say hello
I would love to hear how Prayer House is helping you. Open Contact Us from the menu and send me a message.
`
    },

    /* ---------- MEET OUR TEAM ---------- */
    team: {
      photo: `https://REPLACE-WITH-YOUR-PHOTO-URL/team-member.jpg`,
      name: `Team Member Name`,
      role: `Prayer Coordinator`,
      bio: `I serve as a prayer coordinator for Prayer House. I read every request with care, pray over the ones that weigh on me most, and help keep the wall a kind and safe place. It is an honour to stand with you in prayer.`,
      text: `
## What I do
- Review each request before it is published
- Pray over urgent needs
- Help celebrate answered prayers
- Reply to messages from the community

## How to reach me
Open Contact Us from the menu. Every message is read by the team.
`
    },

    pages: {

      /* ---------- OUR AIMS ---------- */
      aims: {
        title: `Our Aims`,
        hero: [`Why Prayer House exists`, `A place where no one has to carry a burden alone, and every answered prayer is celebrated together.`],
        text: `
## Pray for one another
Every request on the wall is carried by real people. We exist to turn one person's need into a chain of prayer that grows with every tap of “I prayed”.

## Care with dignity
Share as much or as little as you wish. You can post without your name, and every request is read by a moderator before it is published, so the wall stays gracious and safe.

## Celebrate what God does
Prayer does not end when the request is sent. When God answers, you can mark the request as answered and share a testimony, so faith is built across the whole community.

## Rooted in God's Word
> Be careful for nothing; but in every thing by prayer and supplication with thanksgiving let your requests be made known unto God.
> — Philippians 4:6 (KJV)

## Simple enough for everyone
Prayer House is built for Android phones, uses very little data, and keeps working offline. Your requests wait safely on your phone until you are ready to send them.

## Better together
> Bear ye one another's burdens, and so fulfil the law of Christ.
> — Galatians 6:2 (KJV)
`
      },

      /* ---------- HOW TO USE APP ---------- */
      howto: {
        title: `How to Use App`,
        numbered: true,
        hero: [`Getting started takes one minute`, `Here is everything you need to read, pray and share.`],
        text: `
## Read the Prayer Wall
Open the app to see requests that a moderator has approved. Urgent requests are pinned at the top. Use the chips to switch between All, Urgent, Answered and Mine.

## Pray for someone
Tap “I prayed” on a request after you pray. You will be asked to confirm, and each person can add one prayer to a request.

## Share your own request
Tap “New request”, choose a category and write your need. Your name is optional, so you can stay anonymous. Turn on “Mark as urgent” only for pressing needs.

## Wait for approval
Every request is reviewed before it appears on the wall. Follow its progress under Mine: waiting, on the wall, or answered.

## Mark it answered
When God answers, open Mine, tap “Mark as answered”, then share a testimony to encourage others.

## Pass it on
Tap “Pass it on” to send a request to friends through WhatsApp, Facebook or a message.

## Keep going offline
No signal? Requests and prayers wait safely on your phone. Tap “Send now” when you are back online.

## Make it yours
Open the three-dot menu for dark mode, text size, QR Scan & Join, Install App and Share App.
`
      },

      /* ---------- TERMS OF USE ---------- */
      terms: {
        title: `Terms of Use`,
        numbered: true,
        hero: [`Please read before you use Prayer House`, `Last updated: November 2026`],
        text: `
## Welcome
Prayer House is a community space for sharing prayer needs and testimonies. By using the app you agree to these terms. If you do not agree, please do not use it.

## Who may use it
Prayer House is for people of every background who wish to pray or be prayed for. If you are under 18, please use it with the guidance of a parent or guardian.

## What you share
- Share honestly and with respect.
- Do not post phone numbers, addresses, medical records or other private details about yourself or anyone else.
- If you post about another person, make sure they are comfortable with it.
- Do not post anything hateful, misleading, promotional or unlawful.

## Review and removal
Every request and testimony is reviewed before it is published. We may edit, decline or remove content that does not follow these terms, and we may do so without notice.

## Your privacy
- You can post without your name.
- Requests, testimonies and messages are stored in the ministry's own database, and the admin team can read them.
- A random code is kept on your phone so we can show you your own posts and count one prayer per person. It does not contain your name or contact details.
- Your own posts are also saved on your phone so you can read them offline.

## Messages to us
Messages sent through Contact Us and Partner With Us are read by the admin team. Please only share contact details you are happy for us to use when replying.

## Not a substitute for professional help
Prayer House does not replace medical, legal, financial, counselling or emergency help. In an emergency, contact your local emergency services first.

## Changes to these terms
We may update these terms from time to time. Continuing to use the app after an update means you accept the changes.

## Questions
Open Contact Us from the menu and we will gladly help.
`
      },

      /* ---------- PARTNER WITH US ---------- */
      partner: {
        title: `Partner With Us`,
        hero: [`Let us build something that lasts`, `Prayer House grows when ministries, churches and friends link arms. Your gift, skill or platform could be the next link in the chain.`],
        text: `
## Who can partner with us
- Churches and prayer ministries
- Christian organisations and charities
- Intercessory and prayer-chain groups
- Developers, designers and translators
- Friends who want to sponsor the work

## How it works
- Tell us about yourself using the form below
- We read your message and reply as soon as we can
- Together we agree how to work side by side

## What we look for
Shared faith, a heart to serve, and respect for the privacy and dignity of everyone who shares a request.

## Not only money
> Two are better than one; because they have a good reward for their labour.
> — Ecclesiastes 4:9 (KJV)
`
      },

      /* ---------- CONTACT US ---------- */
      contact: {
        title: `Contact Us`,
        hero: [`We would love to hear from you`, `Need prayer, have a question, or want to serve? Reach out the way that is easiest for you. Every message is read by the team.`],
        text: `
## Pick what is easiest
- Email for detailed questions
- WhatsApp for quick messages
- Call for urgent ministry matters
- Facebook for news and community

## What to include
- Your name and how to reach you
- A clear description of your question or idea
- The kind of phone you use, if you are reporting a problem

## Need prayer?
Share your request on the Prayer Wall instead, so many people can stand with you. Moderators read every request before it is published.

## In an emergency
If you or someone near you is in danger, contact your local emergency services first.
`
      }
    }
  };
})(window);
