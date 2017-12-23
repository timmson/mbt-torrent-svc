#!/usr/bin/env bash

tor > /dev/null &
sleep 5
nodejs service.js