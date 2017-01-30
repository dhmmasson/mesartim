
start3() {

    nohup node server.js --port=5009 --database=ideavaluation2 > logs/ideavaluation.log 2> logs/ideavaluation.err.log < /dev/null &
    nohup node server.js --port=5011 --database=Neptune_181016 > logs/neptune1.log 2> logs/neptune1.err.log < /dev/null &
    nohup node server.js --port=5012 --database=AV-IRT_09-12-16 > logs/neptune2.log 2> logs/neptune2.err.log < /dev/null &

}

stopAll() {

    killall node 

}



case "$1" in
  start)
    start3
    ;;
  stop)
    stopAll
    ;;
  restart)
    stopAll
    start3
    ;;
  *)
    echo "Usage: $0 {start|stop|restart}"
esac
