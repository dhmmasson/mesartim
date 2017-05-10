
start3() {

    nohup node server.js --port=5009 --database=tri_biodechets_04-05-17 > logs/ideavaluation.log 2> logs/ideavaluation.err.log < /dev/null &
    nohup node server.js --port=5011 --database=interclustering_21_03_17_brut > logs/neptune1.log 2> logs/neptune1.err.log < /dev/null &
    nohup node server.js --port=5012 --database=Screen_tests_etudiants_27-04-17 > logs/neptune2.log 2> logs/neptune2.err.log < /dev/null &

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
