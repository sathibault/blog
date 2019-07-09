---
layout: post
title:  "Facial Identity Tracking"
date:   2019-07-08 18:03:00
categories: [computer vision]
tags: [ai, streamlogic]
---

![Faces]({{ site.url }}/assets/people-faces.jpg)

Automatic facial image recognition technology has reached a point
where it has been successfully used in a number of real-world
applications.  Along with that success however, has comes some
controversy such as evidence of racial bias and concerns about
privacy.  This post takes a brief look at both the technology and some
techniques to combat issues like bias and data privacy.

## Identity tracking

There are different types of identity tracking technologies, but the
basic idea is to track what locations an individuals has visited and
when.  Cookies are probably the most well known technology which is
used to track the Internet sites a user has visited.  This is useful,
for example, to provide targeted marking based on your virtual
activities.

The new kid on the block is facial image recognition which brings
identity tracking to the physical world.  Although this technology can
be used to attach a specific identity to an image captured by cameras,
it may also be used to only recognized that images from multiple
sources belong to the same person without actually identifying that
person.

Some ethical questions have arisen concerning the use of facial image
recognition.  Not the least of these might be should we even allow
the use of the technology?  While there are certainly some
unacceptable uses cases, I think there are also some valid and even
beneficial use cases.  For example, as public transportation company I
want to understand what transfers customers make and when in order to
provide them with better scheduling and transfer options.

I won't attempt to answer the broader ethical questions, but we will
look at some technical solutions that help mitigate some of the issues
surrounding this technology.  Specifically, I'll present techniques to
deal with bias and data privacy.  Before attacking those however,
let's look at how it works.

## How it works

Identifying an individual from an image has it's challenges: varying
image quality, lighting conditions and camera angle, to name a few.
It is a difficult task even for humans when looking at photos of
unfamiliar faces.  From the software perspective, comparing pixels in
images is a non-starter; there is just too much variation.

The basic idea behind today's image recognition technology is to
extract some kind of fingerprint or signature from a facial image that
is somehow independent of these variations.  Instead of comparing
images directly, we can compare the signatures generated from two
images and assess their similarity.  Much like a hand-written
signature, the “signature” generated from two images of the same
person will not be identical but are similar enough that they can be
compared much like a forensic scientist would compare hand-written
signatures or fingerprints.

[OpenFace](https://cmusatyalab.github.io/openface/) is one such
technology, developed by CMU, that takes a face image as input and
produces a numeric signature for the face.  The graphs below depict
sample output from OpenFace for two different individuals.

![OpenFace signatures]({{ site.url }}/assets/openface-signatures.png){:class="image-center-600"}

As you can see in the top image, there is significant similarity
between the output from two different images of the same person.  And
as expected, the output generated for the images of two different
people, as shown in the bottom image, are quite dissimilar.

Algorithms like OpenFace can be used in two distinct ways:
1. We can compare the image of an unknown person to a database of
images of known people, and based on similarity, identify the specific
individual.
2. We can compare two images from different sources or times, and
based on similarity, determine if they represent the same person
without specifically identifying who the individual is.

## Bias in facial image recognition

Some of the early reports of concern about facial image recognition
were centered around fairness.  As early as 2010, there were reports
of bias in image recognition technology.  In a 2012 paper ["Face
Recognition Performance: Role of Demographic
Information"](http://openbiometrics.org/publications/klare2012demographics.pdf),
the authors demonstrate that many major facial recognition systems are
less accurate for certain groups including black and female faces.

While this type of bias might not be concerning in certain situations,
it can have very serious implications in others, e.g. applications in
law enforcement.  Fortunately, there are solutions to the bias
problem.  The first step was identification, and since it has been
known for several years, there are now approaches available to reduce
bias.  IBM, for example, has developed the [AI Fairness
360](https://www.ibm.com/blogs/research/2018/09/ai-fairness-360/)
open-source toolkit to help practitioners detect and mitigate bias.

## Data privacy

More recently, there has been some activity around the issue of privacy
and facial image technology.  In March of 2019, the NY Times published
["We Built an 'Unbelievable' (but Legal) Facial Recognition
Machine"](https://www.nytimes.com/interactive/2019/04/16/opinion/facial-recognition-new-york-city.html).
This piece reveals how easy it is to use a public web cam to identify
people's presence at public locations.  They scraped websites of
organizations in the area of the web cam to build a database of
people and their images.  They were then able to associate images
captured by the web cam with the database images using very simple
face recognition.

Meanwhile, San Francisco prohibited the use of facial image
recognition in May as part of a broader anti-surveillance ordinance
([San Francisco just banned facial-recognition
technology](https://www.cnn.com/2019/05/14/tech/san-francisco-facial-recognition-ban/index.html)).
Obviously, there is trade-off between privacy and security, but clearly
people are concerned about the use of this technology.  Fortunately,
there are techniques we can employ to protect the privacy of
individuals and still take advantage of facial image recognition.

Two general principles to follow for data privacy are: 1) adhere to
industry standard procedures for access control and encryption, and 2)
limit data access to individuals that need access.  Additionally,
there are a couple of aspects of data protection that are specific to
identity tracking.

First, in many use cases, it is not necessary to keep image data once
facial image "signatures" are calculated.  These can be computed
locally at the image source and images do not even need to be
transferred over networks.  Without the original image, a perpetrator
cannot directly identify individuals, but can only compare the
signatures to other signatures.  In other words, they cannot answer
the general question who was seen, but only was this specific person
seen?  The value of the signatures to infiltrators may be further
limited by not directly using public models such as OpenFace.  In this
case, even to answer the question was this specific individual seen,
they would require access to both the model and the signatures to make
use of them.

Second, for identity tracking, the data only needs to be stored for
the desired tracking duration.  For example, in the public
transportation use case of identifying transfers taken, the signature
data only needs to be keep around for a day.  Signatures can simply be
replaced with anonymous IDs for long term storage.

## Conclusion

As with any technology, computer vision can be leveraged for both
benefit or misuse.  Facial image recognition is a powerful technology
that has the potential to benefit business and government.  While there
are strict regulations in some regions, computer vision technology has
outpaced the legal development in other areas.  Regardless, at
[http://streamlogic.io](http://streamlogic.io), we enable companies to
deploy computer vision technology in socially responsible ways.
