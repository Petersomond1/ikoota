Run echo "🔨 Building API image with SHA: $IMAGE_TAG"
  echo "🔨 Building API image with SHA: $IMAGE_TAG"
  docker build --no-cache -t $ECR_REGISTRY/$ECR_REPOSITORY_API:$IMAGE_TAG ./ikootaapi
  docker tag $ECR_REGISTRY/$ECR_REPOSITORY_API:$IMAGE_TAG $ECR_REGISTRY/$ECR_REPOSITORY_API:latest
  docker push $ECR_REGISTRY/$ECR_REPOSITORY_API:$IMAGE_TAG
  docker push $ECR_REGISTRY/$ECR_REPOSITORY_API:latest
  shell: /usr/bin/bash -e {0}
  env:
    AWS_REGION: us-east-1
    ECR_REPOSITORY_API: ikoota-api
    ECR_REPOSITORY_CLIENT: ikoota-client
    AWS_DEFAULT_REGION: us-east-1
    AWS_ACCESS_KEY_ID: ***
    AWS_SECRET_ACCESS_KEY: ***
    ECR_REGISTRY: 701333809618.dkr.ecr.us-east-1.amazonaws.com
    IMAGE_TAG: 3c1e59bdd9ad8a487e0f52efe57883c342e44186
🔨 Building API image with SHA: 3c1e59bdd9ad8a487e0f52efe57883c342e44186
#0 building with "default" instance using docker driver

#1 [internal] load build definition from Dockerfile
#1 transferring dockerfile: 1.13kB done
#1 DONE 0.0s

#2 [auth] library/node:pull token for registry-1.docker.io
#2 DONE 0.0s

#3 [internal] load metadata for docker.io/library/node:18-alpine
#3 DONE 0.3s

#4 [internal] load .dockerignore
#4 transferring context: 263B done
#4 DONE 0.0s

#5 [internal] load build context
#5 transferring context: 3.06MB 0.0s done
#5 DONE 0.0s

#6 [1/8] FROM docker.io/library/node:18-alpine@sha256:8d6421d663b4c28fd3ebc498332f249011d118945588d0a35cb9bc4b8ca09d9e
#6 resolve docker.io/library/node:18-alpine@sha256:8d6421d663b4c28fd3ebc498332f249011d118945588d0a35cb9bc4b8ca09d9e done
#6 extracting sha256:f18232174bc91741fdf3da96d85011092101a032a93a388b79e99e69c2d5c870
#6 extracting sha256:f18232174bc91741fdf3da96d85011092101a032a93a388b79e99e69c2d5c870 0.1s done
#6 sha256:8d6421d663b4c28fd3ebc498332f249011d118945588d0a35cb9bc4b8ca09d9e 7.67kB / 7.67kB done
#6 sha256:929b04d7c782f04f615cf785488fed452b6569f87c73ff666ad553a7554f0006 1.72kB / 1.72kB done
#6 sha256:ee77c6cd7c1886ecc802ad6cedef3a8ec1ea27d1fb96162bf03dd3710839b8da 6.18kB / 6.18kB done
#6 sha256:f18232174bc91741fdf3da96d85011092101a032a93a388b79e99e69c2d5c870 3.64MB / 3.64MB 0.1s done
#6 sha256:dd71dde834b5c203d162902e6b8994cb2309ae049a0eabc4efea161b2b5a3d0e 11.53MB / 40.01MB 0.2s
#6 sha256:1e5a4c89cee5c0826c540ab06d4b6b491c96eda01837f430bd47f0d26702d6e3 1.26MB / 1.26MB 0.1s done
#6 sha256:25ff2da83641908f65c3a74d80409d6b1b62ccfaab220b9ea70b80df5a2e0549 446B / 446B 0.1s done
#6 sha256:dd71dde834b5c203d162902e6b8994cb2309ae049a0eabc4efea161b2b5a3d0e 18.87MB / 40.01MB 0.3s
#6 sha256:dd71dde834b5c203d162902e6b8994cb2309ae049a0eabc4efea161b2b5a3d0e 25.17MB / 40.01MB 0.4s
#6 sha256:dd71dde834b5c203d162902e6b8994cb2309ae049a0eabc4efea161b2b5a3d0e 38.80MB / 40.01MB 0.6s
#6 sha256:dd71dde834b5c203d162902e6b8994cb2309ae049a0eabc4efea161b2b5a3d0e 40.01MB / 40.01MB 0.6s done
#6 extracting sha256:dd71dde834b5c203d162902e6b8994cb2309ae049a0eabc4efea161b2b5a3d0e 0.1s
#6 extracting sha256:dd71dde834b5c203d162902e6b8994cb2309ae049a0eabc4efea161b2b5a3d0e 1.0s done
#6 extracting sha256:1e5a4c89cee5c0826c540ab06d4b6b491c96eda01837f430bd47f0d26702d6e3
#6 extracting sha256:1e5a4c89cee5c0826c540ab06d4b6b491c96eda01837f430bd47f0d26702d6e3 0.0s done
#6 extracting sha256:25ff2da83641908f65c3a74d80409d6b1b62ccfaab220b9ea70b80df5a2e0549 done
#6 DONE 2.6s

#7 [2/8] RUN apk add --no-cache     python3     py3-pip     cairo-dev     jpeg-dev     pango-dev     giflib-dev     g++     make
#7 0.131 fetch https://dl-cdn.alpinelinux.org/alpine/v3.21/main/x86_64/APKINDEX.tar.gz
#7 0.204 fetch https://dl-cdn.alpinelinux.org/alpine/v3.21/community/x86_64/APKINDEX.tar.gz
#7 0.472 (1/145) Installing cairo-tools (1.18.4-r0)
#7 0.481 (2/145) Installing libexpat (2.7.0-r0)
#7 0.485 (3/145) Installing brotli-libs (1.1.0-r2)
#7 0.494 (4/145) Installing libbz2 (1.0.8-r6)
#7 0.498 (5/145) Installing libpng (1.6.47-r0)
#7 0.509 (6/145) Installing freetype (2.13.3-r0)
#7 0.518 (7/145) Installing fontconfig (2.15.0-r1)
#7 0.533 (8/145) Installing expat (2.7.0-r0)
#7 0.550 (9/145) Installing pkgconf (2.3.0-r0)
#7 0.555 (10/145) Installing expat-dev (2.7.0-r0)
#7 0.561 (11/145) Installing bzip2-dev (1.0.8-r6)
#7 0.564 (12/145) Installing brotli (1.1.0-r2)
#7 0.569 (13/145) Installing brotli-dev (1.1.0-r2)
#7 0.574 (14/145) Installing zlib-dev (1.3.1-r2)
#7 0.578 (15/145) Installing libpng-dev (1.6.47-r0)
#7 0.589 (16/145) Installing freetype-dev (2.13.3-r0)
#7 0.602 (17/145) Installing fontconfig-dev (2.15.0-r1)
#7 0.607 (18/145) Installing libxau (1.0.11-r4)
#7 0.610 (19/145) Installing xorgproto (2024.1-r0)
#7 0.638 (20/145) Installing libxau-dev (1.0.11-r4)
#7 0.643 (21/145) Installing libmd (1.1.0-r0)
#7 0.647 (22/145) Installing libbsd (0.12.2-r0)
#7 0.651 (23/145) Installing libxdmcp (1.1.5-r1)
#7 0.655 (24/145) Installing libxcb (1.16.1-r0)
#7 0.668 (25/145) Installing libx11 (1.8.10-r0)
#7 0.702 (26/145) Installing libxext (1.3.6-r2)
#7 0.710 (27/145) Installing libffi (3.4.7-r0)
#7 0.713 (28/145) Installing gdbm (1.24-r0)
#7 0.716 (29/145) Installing xz-libs (5.6.3-r1)
#7 0.721 (30/145) Installing mpdecimal (4.0.0-r0)
#7 0.725 (31/145) Installing ncurses-terminfo-base (6.5_p20241006-r3)
#7 0.731 (32/145) Installing libncursesw (6.5_p20241006-r3)
#7 0.737 (33/145) Installing libpanelw (6.5_p20241006-r3)
#7 0.739 (34/145) Installing readline (8.2.13-r0)
#7 0.745 (35/145) Installing sqlite-libs (3.48.0-r4)
#7 0.759 (36/145) Installing python3 (3.12.11-r0)
#7 0.936 (37/145) Installing python3-pycache-pyc0 (3.12.11-r0)
#7 1.057 (38/145) Installing pyc (3.12.11-r0)
#7 1.057 (39/145) Installing xcb-proto-pyc (1.17.0-r0)
#7 1.064 (40/145) Installing python3-pyc (3.12.11-r0)
#7 1.064 (41/145) Installing xcb-proto (1.17.0-r0)
#7 1.075 (42/145) Installing libxdmcp-dev (1.1.5-r1)
#7 1.079 (43/145) Installing libxcb-dev (1.16.1-r0)
#7 1.098 (44/145) Installing xtrans (1.5.2-r0)
#7 1.105 (45/145) Installing libx11-dev (1.8.10-r0)
#7 1.113 (46/145) Installing libxext-dev (1.3.6-r2)
#7 1.118 (47/145) Installing libxrender (0.9.11-r5)
#7 1.122 (48/145) Installing libxrender-dev (0.9.11-r5)
#7 1.126 (49/145) Installing pixman (0.43.4-r1)
#7 1.136 (50/145) Installing pixman-dev (0.43.4-r1)
#7 1.140 (51/145) Installing util-macros (1.20.1-r0)
#7 1.145 (52/145) Installing xcb-util (0.4.1-r3)
#7 1.149 (53/145) Installing xcb-util-dev (0.4.1-r3)
#7 1.153 (54/145) Installing cairo (1.18.4-r0)
#7 1.166 (55/145) Installing libintl (0.22.5-r0)
#7 1.171 (56/145) Installing libeconf (0.6.3-r0)
#7 1.174 (57/145) Installing libblkid (2.40.4-r1)
#7 1.179 (58/145) Installing libmount (2.40.4-r1)
#7 1.183 (59/145) Installing pcre2 (10.43-r0)
#7 1.191 (60/145) Installing glib (2.82.5-r0)
#7 1.230 (61/145) Installing cairo-gobject (1.18.4-r0)
#7 1.234 (62/145) Installing libxml2 (2.13.4-r6)
#7 1.245 (63/145) Installing libxml2-utils (2.13.4-r6)
#7 1.249 (64/145) Installing docbook-xml (4.5-r9)
#7 1.273 Executing docbook-xml-4.5-r9.post-install
#7 1.283 (65/145) Installing libgpg-error (1.51-r0)
#7 1.291 (66/145) Installing libgcrypt (1.10.3-r1)
#7 1.630 (67/145) Installing libxslt (1.1.42-r2)
#7 1.640 (68/145) Installing docbook-xsl-ns (1.79.2-r11)
#7 1.805 Executing docbook-xsl-ns-1.79.2-r11.post-install
#7 1.825 (69/145) Installing docbook-xsl-nons (1.79.2-r11)
#7 1.993 Executing docbook-xsl-nons-1.79.2-r11.post-install
#7 2.015 (70/145) Installing docbook-xsl (1.79.2-r11)
#7 2.018 (71/145) Installing xz (5.6.3-r1)
#7 2.025 (72/145) Installing gettext-asprintf (0.22.5-r0)
#7 2.031 (73/145) Installing libunistring (1.2-r0)
#7 2.042 (74/145) Installing gettext-libs (0.22.5-r0)
#7 2.054 (75/145) Installing gettext-envsubst (0.22.5-r0)
#7 2.057 (76/145) Installing libgomp (14.2.0-r4)
#7 2.063 (77/145) Installing gettext (0.22.5-r0)
#7 2.079 (78/145) Installing gettext-dev (0.22.5-r0)
#7 2.097 (79/145) Installing py3-parsing (3.1.4-r0)
#7 2.103 (80/145) Installing py3-parsing-pyc (3.1.4-r0)
#7 2.109 (81/145) Installing py3-packaging (24.2-r0)
#7 2.115 (82/145) Installing py3-packaging-pyc (24.2-r0)
#7 2.120 (83/145) Installing linux-headers (6.6-r1)
#7 2.237 (84/145) Installing libffi-dev (3.4.7-r0)
#7 2.246 (85/145) Installing bsd-compat-headers (0.7.2-r6)
#7 2.251 (86/145) Installing libformw (6.5_p20241006-r3)
#7 2.256 (87/145) Installing libmenuw (6.5_p20241006-r3)
#7 2.290 (88/145) Installing libncurses++ (6.5_p20241006-r3)
#7 2.294 (89/145) Installing ncurses-dev (6.5_p20241006-r3)
#7 2.304 (90/145) Installing libedit (20240808.3.1-r0)
#7 2.309 (91/145) Installing libedit-dev (20240808.3.1-r0)
#7 2.313 (92/145) Installing libpcre2-16 (10.43-r0)
#7 2.324 (93/145) Installing libpcre2-32 (10.43-r0)
#7 2.333 (94/145) Installing pcre2-dev (10.43-r0)
#7 2.357 (95/145) Installing libuuid (2.40.4-r1)
#7 2.374 (96/145) Installing libfdisk (2.40.4-r1)
#7 2.403 (97/145) Installing liblastlog2 (2.40.4-r1)
#7 2.408 (98/145) Installing libsmartcols (2.40.4-r1)
#7 2.413 (99/145) Installing sqlite (3.48.0-r4)
#7 2.431 (100/145) Installing sqlite-dev (3.48.0-r4)
#7 2.438 (101/145) Installing util-linux-dev (2.40.4-r1)
#7 2.447 (102/145) Installing glib-dev (2.82.5-r0)
#7 2.529 (103/145) Installing cairo-dev (1.18.4-r0)
#7 2.538 (104/145) Installing libstdc++-dev (14.2.0-r4)
#7 2.697 (105/145) Installing jansson (2.14-r4)
#7 2.700 (106/145) Installing zstd-libs (1.5.6-r2)
#7 2.709 (107/145) Installing binutils (2.43.1-r3)
#7 2.779 (108/145) Installing libatomic (14.2.0-r4)
#7 2.782 (109/145) Installing gmp (6.3.0-r2)
#7 2.788 (110/145) Installing isl26 (0.26-r1)
#7 2.804 (111/145) Installing mpfr4 (4.2.1-r0)
#7 2.813 (112/145) Installing mpc1 (1.3.1-r1)
#7 2.817 (113/145) Installing gcc (14.2.0-r4)
#7 3.645 (114/145) Installing musl-dev (1.2.5-r9)
#7 3.709 (115/145) Installing g++ (14.2.0-r4)
#7 3.944 (116/145) Installing giflib (5.2.2-r1)
#7 3.949 (117/145) Installing giflib-dev (5.2.2-r1)
#7 3.953 (118/145) Installing libjpeg-turbo (3.0.4-r0)
#7 3.961 (119/145) Installing libturbojpeg (3.0.4-r0)
#7 3.972 (120/145) Installing libjpeg-turbo-dev (3.0.4-r0)
#7 3.977 (121/145) Installing jpeg-dev (9f-r0)
#7 3.977 (122/145) Installing make (4.4.1-r2)
#7 3.982 (123/145) Installing libxft (2.3.8-r3)
#7 3.989 (124/145) Installing graphite2 (1.3.14-r6)
#7 3.993 (125/145) Installing harfbuzz (9.0.0-r1)
#7 4.006 (126/145) Installing fribidi (1.0.16-r0)
#7 4.011 (127/145) Installing pango (1.54.0-r1)
#7 4.020 (128/145) Installing pango-tools (1.54.0-r1)
#7 4.026 (129/145) Installing fribidi-dev (1.0.16-r0)
#7 4.032 (130/145) Installing harfbuzz-cairo (9.0.0-r1)
#7 4.036 (131/145) Installing harfbuzz-gobject (9.0.0-r1)
#7 4.040 (132/145) Installing icu-data-en (74.2-r1)
#7 4.056 Executing icu-data-en-74.2-r1.post-install
#7 4.059 *
#7 4.059 * If you need ICU with non-English locales and legacy charset support, install
#7 4.059 * package icu-data-full.
#7 4.059 *
#7 4.059 (133/145) Installing icu-libs (74.2-r1)
#7 4.091 (134/145) Installing harfbuzz-icu (9.0.0-r1)
#7 4.095 (135/145) Installing harfbuzz-subset (9.0.0-r1)
#7 4.107 (136/145) Installing graphite2-dev (1.3.14-r6)
#7 4.112 (137/145) Installing icu (74.2-r1)
#7 4.125 (138/145) Installing icu-dev (74.2-r1)
#7 4.169 (139/145) Installing harfbuzz-dev (9.0.0-r1)
#7 4.183 (140/145) Installing libxft-dev (2.3.8-r3)
#7 4.190 (141/145) Installing pango-dev (1.54.0-r1)
#7 4.204 (142/145) Installing py3-setuptools (70.3.0-r0)
#7 4.248 (143/145) Installing py3-setuptools-pyc (70.3.0-r0)
#7 4.295 (144/145) Installing py3-pip (24.3.1-r0)
#7 4.368 (145/145) Installing py3-pip-pyc (24.3.1-r0)
#7 4.446 Executing busybox-1.37.0-r12.trigger
#7 4.452 Executing glib-2.82.5-r0.trigger
#7 4.456 No schema files found: doing nothing.
#7 4.463 OK: 393 MiB in 162 packages
#7 DONE 5.3s

#8 [3/8] WORKDIR /app
#8 DONE 0.0s

#9 [4/8] COPY package*.json ./
#9 DONE 0.0s

#10 [5/8] RUN npm ci --only=production
#10 0.235 npm warn config only Use `--omit=dev` to omit dev dependencies from the install.
#10 2.395 npm warn deprecated rimraf@3.0.2: Rimraf versions prior to v4 are no longer supported
#10 2.564 npm warn deprecated npmlog@5.0.1: This package is no longer supported.
#10 2.609 npm warn deprecated querystring@0.2.0: The querystring API is considered Legacy. new code should use the URLSearchParams API instead.
#10 2.782 npm warn deprecated inflight@1.0.6: This module is not supported, and leaks memory. Do not use it. Check out lru-cache if you want a good and tested way to coalesce async requests by a key value, which is much more comprehensive and powerful.
#10 2.838 npm warn deprecated glob@7.2.3: Glob versions prior to v9 are no longer supported
#10 3.131 npm warn deprecated multer@1.4.5-lts.2: Multer 1.x is impacted by a number of vulnerabilities, which have been patched in 2.x. You should upgrade to the latest 2.x version.
#10 3.134 npm warn deprecated crypto@1.0.1: This package is no longer supported. It's now a built-in Node module. If you've depended on crypto, you should switch to the one that's built-in.
#10 3.254 npm warn deprecated gauge@3.0.2: This package is no longer supported.
#10 3.340 npm warn deprecated are-we-there-yet@2.0.0: This package is no longer supported.
#10 4.410 npm warn deprecated rimraf@3.0.2: Rimraf versions prior to v4 are no longer supported
#10 4.430 npm warn deprecated rimraf@2.7.1: Rimraf versions prior to v4 are no longer supported
#10 50.07 
#10 50.07 added 482 packages, and audited 484 packages in 50s
#10 50.07 
#10 50.07 55 packages are looking for funding
#10 50.07   run `npm fund` for details
#10 50.07 
#10 50.07 3 vulnerabilities (2 low, 1 high)
#10 50.07 
#10 50.07 To address all issues, run:
#10 50.07   npm audit fix
#10 50.07 
#10 50.07 Run `npm audit` for details.
#10 50.08 npm notice
#10 50.08 npm notice New major version of npm available! 10.8.2 -> 11.6.0
#10 50.08 npm notice Changelog: https://github.com/npm/cli/releases/tag/v11.6.0
#10 50.08 npm notice To update run: npm install -g npm@11.6.0
#10 50.08 npm notice
#10 DONE 50.6s

#11 [6/8] COPY . .
#11 DONE 0.0s

#12 [7/8] RUN mkdir -p models/face models/posenet models/avatar-gan
#12 DONE 0.1s

#13 [8/8] RUN addgroup -g 1001 -S nodejs &&     adduser -S nodejs -u 1001 &&     chown -R nodejs:nodejs /app
#13 DONE 14.5s

#14 exporting to image
#14 exporting layers
#14 exporting layers 7.7s done
#14 writing image sha256:1e3215b288b281c0d880c58ab7a4cf9845637769daf8f7a3e57c4aea17d4e1c1 done
#14 naming to 701333809618.dkr.ecr.us-east-1.amazonaws.com/ikoota-api:3c1e59bdd9ad8a487e0f52efe57883c342e44186 done
#14 DONE 7.7s
The push refers to repository [701333809618.dkr.ecr.us-east-1.amazonaws.com/ikoota-api]
8331ebe82d49: Preparing
380d62f65d64: Preparing
c78ac273d8ad: Preparing
4f8d2e028b86: Preparing
932a7c097f50: Preparing
5162b6ff353d: Preparing
df01c1da5987: Preparing
82140d9a70a7: Preparing
f3b40b0cdb1c: Preparing
0b1f26057bd0: Preparing
08000c18d16d: Preparing
5162b6ff353d: Waiting
df01c1da5987: Waiting
82140d9a70a7: Waiting
f3b40b0cdb1c: Waiting
0b1f26057bd0: Waiting
08000c18d16d: Waiting
932a7c097f50: Pushed
380d62f65d64: Pushed
c78ac273d8ad: Pushed
82140d9a70a7: Layer already exists
f3b40b0cdb1c: Layer already exists
0b1f26057bd0: Layer already exists
08000c18d16d: Layer already exists
5162b6ff353d: Pushed
df01c1da5987: Pushed
8331ebe82d49: Pushed
4f8d2e028b86: Pushed
3c1e59bdd9ad8a487e0f52efe57883c342e44186: digest: sha256:9cd6b652b03a55560f35e2abc66648fbea84c8f0753322b0d00438724f5955fe size: 2629
The push refers to repository [701333809618.dkr.ecr.us-east-1.amazonaws.com/ikoota-api]
8331ebe82d49: Preparing
380d62f65d64: Preparing
c78ac273d8ad: Preparing
4f8d2e028b86: Preparing
932a7c097f50: Preparing
5162b6ff353d: Preparing
df01c1da5987: Preparing
82140d9a70a7: Preparing
f3b40b0cdb1c: Preparing
0b1f26057bd0: Preparing
08000c18d16d: Preparing
82140d9a70a7: Waiting
f3b40b0cdb1c: Waiting
5162b6ff353d: Waiting
df01c1da5987: Waiting
0b1f26057bd0: Waiting
08000c18d16d: Waiting
380d62f65d64: Layer already exists
8331ebe82d49: Layer already exists
4f8d2e028b86: Layer already exists
c78ac273d8ad: Layer already exists
932a7c097f50: Layer already exists
f3b40b0cdb1c: Layer already exists
82140d9a70a7: Layer already exists
df01c1da5987: Layer already exists
0b1f26057bd0: Layer already exists
5162b6ff353d: Layer already exists
08000c18d16d: Layer already exists
latest: digest: sha256:9cd6b652b03a55560f35e2abc66648fbea84c8f0753322b0d00438724f5955fe size: 2629
19s
Run echo "🔨 Building CLIENT image for staging with SHA: $IMAGE_TAG"
  echo "🔨 Building CLIENT image for staging with SHA: $IMAGE_TAG"
  docker build --no-cache --build-arg ENVIRONMENT=staging -t $ECR_REGISTRY/$ECR_REPOSITORY_CLIENT:$IMAGE_TAG-staging ./ikootaclient
  docker tag $ECR_REGISTRY/$ECR_REPOSITORY_CLIENT:$IMAGE_TAG-staging $ECR_REGISTRY/$ECR_REPOSITORY_CLIENT:latest-staging
  docker push $ECR_REGISTRY/$ECR_REPOSITORY_CLIENT:$IMAGE_TAG-staging
  docker push $ECR_REGISTRY/$ECR_REPOSITORY_CLIENT:latest-staging
  shell: /usr/bin/bash -e {0}
  env:
    AWS_REGION: us-east-1
    ECR_REPOSITORY_API: ikoota-api
    ECR_REPOSITORY_CLIENT: ikoota-client
    AWS_DEFAULT_REGION: us-east-1
    AWS_ACCESS_KEY_ID: ***
    AWS_SECRET_ACCESS_KEY: ***
    ECR_REGISTRY: 701333809618.dkr.ecr.us-east-1.amazonaws.com
    IMAGE_TAG: 3c1e59bdd9ad8a487e0f52efe57883c342e44186
🔨 Building CLIENT image for staging with SHA: 3c1e59bdd9ad8a487e0f52efe57883c342e44186
#0 building with "default" instance using docker driver

#1 [internal] load build definition from Dockerfile
#1 transferring dockerfile: 1.45kB done
#1 DONE 0.0s

#2 [auth] library/nginx:pull token for registry-1.docker.io
#2 DONE 0.0s

#3 [internal] load metadata for docker.io/library/node:18-alpine
#3 DONE 0.1s

#4 [internal] load metadata for docker.io/library/nginx:alpine
#4 DONE 0.3s

#5 [internal] load .dockerignore
#5 transferring context: 215B done
#5 DONE 0.0s

#6 [builder  1/11] FROM docker.io/library/node:18-alpine@sha256:8d6421d663b4c28fd3ebc498332f249011d118945588d0a35cb9bc4b8ca09d9e
#6 CACHED

#7 [builder  2/11] WORKDIR /app
#7 DONE 0.0s

#8 [internal] load build context
#8 transferring context: 9.60MB 0.1s done
#8 DONE 0.1s

#9 [builder  3/11] COPY package*.json ./
#9 DONE 0.0s

#10 [stage-1 1/4] FROM docker.io/library/nginx:alpine@sha256:42a516af16b852e33b7682d5ef8acbd5d13fe08fecadc7ed98605ba5e3b26ab8
#10 resolve docker.io/library/nginx:alpine@sha256:42a516af16b852e33b7682d5ef8acbd5d13fe08fecadc7ed98605ba5e3b26ab8 done
#10 sha256:60e48a050b6408d0c5dd59b98b6e36bf0937a0bbe99304e3e9c0e63b7563443a 2.50kB / 2.50kB done
#10 sha256:4a86014ec6994761b7f3118cf47e4b4fd6bac15fc6fa262c4f356386bbc0e9d9 10.78kB / 10.78kB done
#10 sha256:42a516af16b852e33b7682d5ef8acbd5d13fe08fecadc7ed98605ba5e3b26ab8 10.33kB / 10.33kB done
#10 sha256:9824c27679d3b27c5e1cb00a73adb6f4f8d556994111c12db3c5d61a0c843df8 3.80MB / 3.80MB 0.2s done
#10 sha256:6bc572a340ecbc60aca0c624f76b32de0b073d5efa4fa1e0b6d9da6405976946 1.81MB / 1.81MB 0.1s done
#10 sha256:403e3f251637881bbdc5fb06df8da55c149c00ccb0addbcb7839fa4ad60dfd04 628B / 628B 0.1s done
#10 sha256:9adfbae99cb79774fdc14ca03a0a0154b8c199a69f69316bcfce64b07f80719f 955B / 955B 0.2s done
#10 extracting sha256:9824c27679d3b27c5e1cb00a73adb6f4f8d556994111c12db3c5d61a0c843df8
#10 sha256:c9ebe2ff2d2cd981811cefb6df49a116da6074c770c07ee86a6ae2ebe7eee926 1.21kB / 1.21kB 0.2s done
#10 sha256:a992fbc61ecc9d8291c27f9add7b8a07d374c06a435d4734519b634762cf1c51 1.40kB / 1.40kB 0.2s done
#10 sha256:cb1ff4086f82493a4b8b02ec71bfed092cad25bd5bf302aec78d4979895350cb 0B / 16.84MB 0.2s
#10 sha256:7a8a46741e18ed98437271669138116163f14596f411c1948fd7836e39f1afea 405B / 405B 0.1s done
#10 extracting sha256:9824c27679d3b27c5e1cb00a73adb6f4f8d556994111c12db3c5d61a0c843df8 0.1s done
#10 sha256:cb1ff4086f82493a4b8b02ec71bfed092cad25bd5bf302aec78d4979895350cb 3.15MB / 16.84MB 0.3s
#10 extracting sha256:6bc572a340ecbc60aca0c624f76b32de0b073d5efa4fa1e0b6d9da6405976946
#10 sha256:cb1ff4086f82493a4b8b02ec71bfed092cad25bd5bf302aec78d4979895350cb 12.58MB / 16.84MB 0.5s
#10 extracting sha256:6bc572a340ecbc60aca0c624f76b32de0b073d5efa4fa1e0b6d9da6405976946 0.1s done
#10 sha256:cb1ff4086f82493a4b8b02ec71bfed092cad25bd5bf302aec78d4979895350cb 14.68MB / 16.84MB 0.6s
#10 extracting sha256:403e3f251637881bbdc5fb06df8da55c149c00ccb0addbcb7839fa4ad60dfd04 done
#10 extracting sha256:9adfbae99cb79774fdc14ca03a0a0154b8c199a69f69316bcfce64b07f80719f done
#10 extracting sha256:7a8a46741e18ed98437271669138116163f14596f411c1948fd7836e39f1afea done
#10 extracting sha256:c9ebe2ff2d2cd981811cefb6df49a116da6074c770c07ee86a6ae2ebe7eee926 done
#10 extracting sha256:a992fbc61ecc9d8291c27f9add7b8a07d374c06a435d4734519b634762cf1c51 done
#10 extracting sha256:cb1ff4086f82493a4b8b02ec71bfed092cad25bd5bf302aec78d4979895350cb
#10 sha256:cb1ff4086f82493a4b8b02ec71bfed092cad25bd5bf302aec78d4979895350cb 16.84MB / 16.84MB 0.6s done
#10 extracting sha256:cb1ff4086f82493a4b8b02ec71bfed092cad25bd5bf302aec78d4979895350cb 0.4s done
#10 DONE 1.2s

#11 [builder  4/11] RUN npm ci
#11 1.037 npm warn EBADENGINE Unsupported engine {
#11 1.037 npm warn EBADENGINE   package: 'react-router@7.9.1',
#11 1.037 npm warn EBADENGINE   required: { node: '>=20.0.0' },
#11 1.037 npm warn EBADENGINE   current: { node: 'v18.20.8', npm: '10.8.2' }
#11 1.037 npm warn EBADENGINE }
#11 1.037 npm warn EBADENGINE Unsupported engine {
#11 1.037 npm warn EBADENGINE   package: 'react-router-dom@7.9.1',
#11 1.037 npm warn EBADENGINE   required: { node: '>=20.0.0' },
#11 1.037 npm warn EBADENGINE   current: { node: 'v18.20.8', npm: '10.8.2' }
#11 1.037 npm warn EBADENGINE }
#11 6.139 
#11 6.139 added 312 packages, and audited 313 packages in 6s
#11 6.139 
#11 6.139 117 packages are looking for funding
#11 6.139   run `npm fund` for details
#11 6.141 
#11 6.141 found 0 vulnerabilities
#11 6.142 npm notice
#11 6.142 npm notice New major version of npm available! 10.8.2 -> 11.6.0
#11 6.142 npm notice Changelog: https://github.com/npm/cli/releases/tag/v11.6.0
#11 6.142 npm notice To update run: npm install -g npm@11.6.0
#11 6.142 npm notice
#11 DONE 6.6s

#12 [builder  5/11] COPY . .
#12 DONE 0.0s

#13 [builder  6/11] RUN echo "🔧 Building with ENVIRONMENT=staging"
#13 0.110 🔧 Building with ENVIRONMENT=staging
#13 DONE 0.1s

#14 [builder  7/11] RUN echo "🔧 NODE_ENV=production"
#14 0.123 🔧 NODE_ENV=production
#14 DONE 0.1s

#15 [builder  8/11] RUN ls -la .env* || echo "No .env files found"
#15 0.126 -rw-r--r--    1 root     root           114 Sep 18 20:05 .env.production
#15 DONE 0.1s

#16 [builder  9/11] RUN npm run build
#16 0.270 
#16 0.270 > ikootaclient@0.0.0 build
#16 0.270 > vite build
#16 0.270 
#16 0.496 vite v6.3.6 building for production...
#16 0.570 transforming...
#16 5.808 ✓ 1991 modules transformed.
#16 6.155 rendering chunks...
#16 7.715 computing gzip size...
#16 7.785 dist/index.html                          0.46 kB │ gzip:   0.29 kB
#16 7.785 dist/assets/sky-C-eMabB2.png         1,221.96 kB
#16 7.785 dist/assets/index-CZ_jjR4h.css         390.28 kB │ gzip:  63.36 kB
#16 7.785 dist/assets/Mixcloud-CMLu3RvO.js         2.75 kB │ gzip:   1.35 kB │ map:     8.04 kB
#16 7.785 dist/assets/Kaltura-BNUr7Q1S.js          2.90 kB │ gzip:   1.39 kB │ map:     8.40 kB
#16 7.785 dist/assets/Vidyard-CnuOeYL_.js          2.96 kB │ gzip:   1.41 kB │ map:     8.70 kB
#16 7.785 dist/assets/SoundCloud-CfRiOqkQ.js       3.03 kB │ gzip:   1.44 kB │ map:     8.92 kB
#16 7.785 dist/assets/Streamable-D1xeYnrH.js       3.04 kB │ gzip:   1.41 kB │ map:     8.63 kB
#16 7.785 dist/assets/DailyMotion-BfoTWr73.js      3.07 kB │ gzip:   1.46 kB │ map:     9.06 kB
#16 7.786 dist/assets/Preview-DLYsOC7a.js          3.11 kB │ gzip:   1.52 kB │ map:     8.88 kB
#16 7.786 dist/assets/Twitch-C2v7r9We.js           3.19 kB │ gzip:   1.50 kB │ map:     9.25 kB
#16 7.786 dist/assets/Facebook-Bsgg2tzu.js         3.32 kB │ gzip:   1.52 kB │ map:     9.30 kB
#16 7.786 dist/assets/Wistia-PVGABXaN.js           3.62 kB │ gzip:   1.60 kB │ map:    10.33 kB
#16 7.786 dist/assets/Vimeo-BUMz6Ytf.js            3.73 kB │ gzip:   1.59 kB │ map:    10.64 kB
#16 7.786 dist/assets/YouTube-DPIFEKtG.js          4.56 kB │ gzip:   2.13 kB │ map:    13.91 kB
#16 7.786 dist/assets/Mux-7YJNocwD.js              5.46 kB │ gzip:   2.00 kB │ map:    14.66 kB
#16 7.786 dist/assets/FilePlayer-C_V3zfrR.js       9.15 kB │ gzip:   3.16 kB │ map:    24.87 kB
#16 7.786 dist/assets/index-CQiteCC0.js        1,488.53 kB │ gzip: 393.01 kB │ map: 4,953.10 kB
#16 7.786 
#16 7.786 (!) Some chunks are larger than 500 kB after minification. Consider:
#16 7.786 - Using dynamic import() to code-split the application
#16 7.786 - Use build.rollupOptions.output.manualChunks to improve chunking: https://rollupjs.org/configuration-options/#output-manualchunks
#16 7.786 - Adjust chunk size limit for this warning via build.chunkSizeWarningLimit.
#16 7.787 ✓ built in 7.26s
#16 DONE 7.9s

#17 [builder 10/11] RUN ls -la dist/
#17 0.135 total 5392
#17 0.135 drwxr-xr-x    3 root     root          4096 Sep 18 20:07 .
#17 0.135 drwxr-xr-x    1 root     root          4096 Sep 18 20:07 ..
#17 0.135 -rw-r--r--    1 root     root        586275 Sep 18 20:07 alphabets.png
#17 0.135 -rw-r--r--    1 root     root          2219 Sep 18 20:07 arrowDown.png
#17 0.135 -rw-r--r--    1 root     root          2208 Sep 18 20:07 arrowUp.png
#17 0.135 drwxr-xr-x    2 root     root          4096 Sep 18 20:07 assets
#17 0.135 -rw-r--r--    1 root     root          3868 Sep 18 20:07 avatar.png
#17 0.135 -rw-r--r--    1 root     root        201094 Sep 18 20:07 bg.jpg
#17 0.135 -rw-r--r--    1 root     root          2331 Sep 18 20:07 camera.png
#17 0.135 -rw-r--r--    1 root     root          1908 Sep 18 20:07 download.png
#17 0.135 -rw-r--r--    1 root     root          2242 Sep 18 20:07 edit.png
#17 0.135 -rw-r--r--    1 root     root          2778 Sep 18 20:07 emoji.png
#17 0.135 -rw-r--r--    1 root     root          6140 Sep 18 20:07 favicon.png
#17 0.135 -rw-r--r--    1 root     root        338737 Sep 18 20:07 iko background4.png
#17 0.135 -rw-r--r--    1 root     root          2027 Sep 18 20:07 img.png
#17 0.135 -rw-r--r--    1 root     root           456 Sep 18 20:07 index.html
#17 0.135 -rw-r--r--    1 root     root          2317 Sep 18 20:07 info.png
#17 0.135 -rw-r--r--    1 root     root       1132669 Sep 18 20:07 maps of ancient ancient age with head land as rivers of life 2.png
#17 0.135 -rw-r--r--    1 root     root       1132643 Sep 18 20:07 maps of ancient ancient age with head land as rivers of life.png
#17 0.135 -rw-r--r--    1 root     root          2314 Sep 18 20:07 mic.png
#17 0.135 -rw-r--r--    1 root     root          1673 Sep 18 20:07 minus.png
#17 0.135 -rw-r--r--    1 root     root          1979 Sep 18 20:07 more.png
#17 0.135 -rw-r--r--    1 root     root        290601 Sep 18 20:07 palmTree.png
#17 0.135 -rw-r--r--    1 root     root        454502 Sep 18 20:07 palmTree2.png
#17 0.135 -rw-r--r--    1 root     root         33802 Sep 18 20:07 palmTree3.png
#17 0.135 -rw-r--r--    1 root     root          2270 Sep 18 20:07 phone.png
#17 0.135 -rw-r--r--    1 root     root          1729 Sep 18 20:07 plus.png
#17 0.135 -rw-r--r--    1 root     root          2417 Sep 18 20:07 public
#17 0.135 -rw-r--r--    1 root     root          2530 Sep 18 20:07 search.png
#17 0.135 -rw-r--r--    1 root     root       1221963 Sep 18 20:07 sky.png
#17 0.135 -rw-r--r--    1 root     root         10212 Sep 18 20:07 theme.png
#17 0.135 -rw-r--r--    1 root     root          1838 Sep 18 20:07 video.png
#17 DONE 0.1s

#18 [builder 11/11] RUN echo "✅ Build completed successfully"
#18 0.114 ✅ Build completed successfully
#18 DONE 0.1s

#19 [stage-1 2/4] COPY --from=builder /app/dist /usr/share/nginx/html
#19 DONE 0.0s

#20 [stage-1 3/4] COPY nginx*.conf /tmp/
#20 DONE 0.0s

#21 [stage-1 4/4] RUN if [ "staging" = "production" ]; then       cp /tmp/nginx.prod.conf /etc/nginx/conf.d/default.conf;     else       cp /tmp/nginx.conf /etc/nginx/conf.d/default.conf;     fi
#21 DONE 0.1s

#22 exporting to image
#22 exporting layers
#22 exporting layers 0.6s done
#22 writing image sha256:dd647c9d539050800ced477cd166c540d9f9c60296b7336ee44f70c81283db1d done
#22 naming to 701333809618.dkr.ecr.us-east-1.amazonaws.com/ikoota-client:3c1e59bdd9ad8a487e0f52efe57883c342e44186-staging done
#22 DONE 0.6s
The push refers to repository [701333809618.dkr.ecr.us-east-1.amazonaws.com/ikoota-client]
b056619d0a7f: Preparing
49dba5d6f8f0: Preparing
2aec9c3582e1: Preparing
f9985d3fc94d: Preparing
d208138be39d: Preparing
a2b76470e8f1: Preparing
917b2c97271e: Preparing
16ca725632e5: Preparing
7978a9c91f72: Preparing
b6ff0212304e: Preparing
418dccb7d85a: Preparing
a2b76470e8f1: Waiting
7978a9c91f72: Waiting
b6ff0212304e: Waiting
418dccb7d85a: Waiting
917b2c97271e: Waiting
16ca725632e5: Waiting
d208138be39d: Layer already exists
f9985d3fc94d: Layer already exists
a2b76470e8f1: Layer already exists
917b2c97271e: Layer already exists
16ca725632e5: Layer already exists
7978a9c91f72: Layer already exists
418dccb7d85a: Layer already exists
b6ff0212304e: Layer already exists
49dba5d6f8f0: Pushed
b056619d0a7f: Pushed
2aec9c3582e1: Pushed
3c1e59bdd9ad8a487e0f52efe57883c342e44186-staging: digest: sha256:118ce2bc854597970c84819503a30ca7b95d7b0edd1176b566d1595eff528969 size: 2614
The push refers to repository [701333809618.dkr.ecr.us-east-1.amazonaws.com/ikoota-client]
b056619d0a7f: Preparing
49dba5d6f8f0: Preparing
2aec9c3582e1: Preparing
f9985d3fc94d: Preparing
d208138be39d: Preparing
a2b76470e8f1: Preparing
917b2c97271e: Preparing
16ca725632e5: Preparing
7978a9c91f72: Preparing
b6ff0212304e: Preparing
418dccb7d85a: Preparing
16ca725632e5: Waiting
7978a9c91f72: Waiting
b6ff0212304e: Waiting
418dccb7d85a: Waiting
a2b76470e8f1: Waiting
917b2c97271e: Waiting
f9985d3fc94d: Layer already exists
b056619d0a7f: Layer already exists
d208138be39d: Layer already exists
49dba5d6f8f0: Layer already exists
2aec9c3582e1: Layer already exists
a2b76470e8f1: Layer already exists
917b2c97271e: Layer already exists
16ca725632e5: Layer already exists
7978a9c91f72: Layer already exists
b6ff0212304e: Layer already exists
418dccb7d85a: Layer already exists
latest-staging: digest: sha256:118ce2bc854597970c84819503a30ca7b95d7b0edd1176b566d1595eff528969 size: 2614
5s
Run # Update API task definition with new SHA-tagged image
  # Update API task definition with new SHA-tagged image
  API_TASK_DEFINITION=$(aws ecs describe-task-definition --task-definition ikoota-api-staging --query 'taskDefinition')
  NEW_API_IMAGE="$ECR_REGISTRY/$ECR_REPOSITORY_API:$IMAGE_TAG"
  UPDATED_API_TASK_DEFINITION=$(echo $API_TASK_DEFINITION | jq --arg IMAGE "$NEW_API_IMAGE" '.containerDefinitions[0].image = $IMAGE | del(.taskDefinitionArn) | del(.revision) | del(.status) | del(.requiresAttributes) | del(.placementConstraints) | del(.compatibilities) | del(.registeredAt) | del(.registeredBy)')
  
  # Register new API task definition for staging
  API_TASK_DEF_ARN=$(aws ecs register-task-definition --cli-input-json "$UPDATED_API_TASK_DEFINITION" --query 'taskDefinition.taskDefinitionArn' --output text)
  echo "✅ Registered new staging API task definition: $API_TASK_DEF_ARN"
  
  # Update CLIENT task definition with new SHA-tagged image
  CLIENT_TASK_DEFINITION=$(aws ecs describe-task-definition --task-definition ikoota-client-staging --query 'taskDefinition')
  NEW_CLIENT_IMAGE="$ECR_REGISTRY/$ECR_REPOSITORY_CLIENT:$IMAGE_TAG-staging"
  UPDATED_CLIENT_TASK_DEFINITION=$(echo $CLIENT_TASK_DEFINITION | jq --arg IMAGE "$NEW_CLIENT_IMAGE" '.containerDefinitions[0].image = $IMAGE | del(.taskDefinitionArn) | del(.revision) | del(.status) | del(.requiresAttributes) | del(.placementConstraints) | del(.compatibilities) | del(.registeredAt) | del(.registeredBy)')
  
  # Register new CLIENT task definition for staging
  CLIENT_TASK_DEF_ARN=$(aws ecs register-task-definition --cli-input-json "$UPDATED_CLIENT_TASK_DEFINITION" --query 'taskDefinition.taskDefinitionArn' --output text)
  echo "✅ Registered new staging CLIENT task definition: $CLIENT_TASK_DEF_ARN"
  
  # Update ECS services with specific task definition ARNs
  echo "🚀 Updating staging API service with new task definition..."
  aws ecs update-service \
    --cluster ikoota-staging \
    --service ikoota-api-staging \
    --task-definition "$API_TASK_DEF_ARN" \
    --force-new-deployment
  
  echo "🚀 Updating staging CLIENT service with new task definition..."
  aws ecs update-service \
    --cluster ikoota-staging \
    --service ikoota-client-staging \
    --task-definition "$CLIENT_TASK_DEF_ARN" \
    --force-new-deployment
  shell: /usr/bin/bash -e {0}
  env:
    AWS_REGION: us-east-1
    ECR_REPOSITORY_API: ikoota-api
    ECR_REPOSITORY_CLIENT: ikoota-client
    AWS_DEFAULT_REGION: us-east-1
    AWS_ACCESS_KEY_ID: ***
    AWS_SECRET_ACCESS_KEY: ***
    ECR_REGISTRY: 701333809618.dkr.ecr.us-east-1.amazonaws.com
    IMAGE_TAG: 3c1e59bdd9ad8a487e0f52efe57883c342e44186

An error occurred (ClientException) when calling the DescribeTaskDefinition operation: Unable to describe task definition.
Error: Process completed with exit code 254.
0s
0s
0s
1s
