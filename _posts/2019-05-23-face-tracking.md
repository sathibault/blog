---
layout: post
title:  "Counting People in Motion"
date:   2019-05-23 10:52:00
categories: [computer vision]
tags: [ai, streamlogic]
---

![Stream CAM]({{ site.url }}/assets/face-tracking.png)

Counting is one of the basic tasks of computer vision with countless
applications across many domains.  One of our favorite things to count
is people.  We count people for attendance at events, to determine
capacity usage of rooms or public transportation, to analyze shopping
habits, etc.  In this post, I want to focus on applications that need
to count people that are moving.  In particular, we will look at
counting people passing a street cam as in this [sample
video](https://www.youtube.com/watch?v=IK9Cai2LbUQ).  However, these
same ideas apply to counting people in a store, moving through the
train station, etc.

## Step 1 - Detecting people

The first step will be to determine how to identify people within an
image.  To accomplish, I chose to use face detection rather than
detecting the whole body.  In many applications, the body is only
partially visible and faces are more likely to be completely visible.
Besides that, face detection has been well studied for a long time.
In fact, we have some choices between face detection algorithms using
traditional image processing
([HOG](https://www.learnopencv.com/histogram-of-oriented-gradients/))
or the more recent deep neural networks
([DNN](https://www.learnopencv.com/neural-networks-a-30000-feet-view-for-beginners/)).
Both of these approaches involve machine learning to train a model
that takes an image as input and outputs a list of bounding boxes
around the regions of the image that contain a human face.  There are
pretrained models available and I chose to use a [pretrained DNN
model](https://github.com/opencv/opencv_3rdparty/tree/19512576c112aa2c7b6328cb0e8d589a4a90a26d).

## Step 2 - Detecting people across frames

With our face detection algorithm in hand, we can easily count the
number of faces in a single image.  Our challenge now is how to extend
this to video?  A video is just a sequence of individual frames, so we
can simply apply the face detection algorithm to each frame.  For
counting, we would only like to find faces that we haven’t already
counted in previous frames.  One simple approach is to keep the
locations of faces from the previous frame, detect faces in the new
frame in discard any that overlap by a certain amount with the
previous faces.  This could work and will give you an estimate, but
there are a couple of issues.  In a crowded environment, overlap may
not be a good indication that this is the same face.  This could lead
to undercounting.  Another issue is that the face detection is
computationally expensive and its preferable to avoid doing it on
every frame.

A more sophisticated approach is to use employ object tracking.
Object tracking algorithms are developed specifically for tracking
unique objects from one frame to the next in a video.  These
algorithms can run faster than face detection and are based not just
on the object’s location but also its visual appearance.  I chose to
use the tracking algorithm available in the [Dlib](http://dlib.net/)
C++ library.  The algorithm tracks objects by searching for the object
in an area around the location of the object in the previous frame.
It can handle not only objects moving between frames but also getting
larger/smaller as it moves closer/farther away.

## Algorithm I

Combining the face detection with object tracking, the following
algorithm will count people moving past a camera:

1. Initialize count and object tracker
1. For each video frame:
    1. Update object tracker with new video frame
    1. Every Nth video frame:
        1. Run face detection
        1. Match faces with locations of objects already being tracked
        1. Increment count for each new face
        1. Add each new face to object tracker
        1. Remove objects from tracker not matched

The above algorithm is a good first start, but it suffers from one
major problem: as people are moving through the video, particularly in
a crowd, their face may get occluded by other people or objects.  For
example, in the clip below, the man in the middle is initially visible
and completely occluded as the woman passes in front of him and then
reappears.

 <video width="640" height="360" controls>
  <source src="http://sathibault.github.io/blog/assets/face-tracking-occlude.mp4" type="video/mp4">
Your browser does not support the video tag.
</video> 

The face is not detected during this period and when it reappears it
gets counted as a new face.  As a result, using algorithm I will
frequently overcount people.  There are 8 unique people in the sample
clip, and this algorithm counts 13.

## Deduplication via clustering

To combat this overcounting, we need to be able to determine if two
face images are of the same person.  Fortunately, there are a number
of ways to compare two images for similarity.  In the case of face
images, CMU has developed a simulator model specifically for faces
called [OpenFace](https://cmusatyalab.github.io/openface/).  The CMU
model takes a face image as input and produces a numeric signature for
the face.  Just like hand written signatures, the OpenFace “signature”
of two images of the same person’s face is not exactly the same but
will be similar and can easily be compared for similarity.

How can we incorporate face similarity into algorithm 1 to reduce
overcounting?  It could be done on the fly, comparing each new face to
previously seen faces, but for my application I chose to split the
problem in two stages, 1) use algorithm 1 to collect faces as they
appear in the video, and 2) deduplicate the collected faces using the
OpenFace similarity measure once.  The deduplication stage is based on
clustering.

Clustering is a machine learning technique for grouping a set of
things based on how similar they are.  Clustering can be done for any
set of objects as long as you have a function that can compute the
similarity between two objects.  OpenFace gives us exactly that for
face images!  The OpenFace output is a high-dimension numeric vector.
The following image shows a 2-dimension visualization of the OpenFace
vectors generated for the faces extracted from the sample video.
![Clustering visualization]({{ site.url }}/assets/face-tracking-tsne.png)
Each point represents one face and the color represents the cluster it was
assigned to.

Using the clustering algorithm to organize faces into clusters based
on how similar they, we expect to get one cluster per unique person.
Thus, the number of clusters is the number of unique people.

## Algorithm II

Combining algorithm I with the deduplication stage desribed above, the
final algorithm is:

1. Run algorithm I to collect all new face images appearing in the video
2. Cluster the face images using the OpenFace similarity measure
3. Set the person count to the number of clusters

After incorporating the clustering stage into the original algorithm,
the output for the sample video is now 9 (vs 13 using algorithm I
without clustering).  This result was accomplished using only readily
available algorithms/models without any training.  Accuracy could be
improved even further by training (or fine tuning) models for the
specific context of the application.
