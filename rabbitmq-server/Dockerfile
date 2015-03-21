FROM dockerfile/rabbitmq 

RUN rabbitmq-plugins enable rabbitmq_management
RUN rabbitmq-plugins enable rabbitmq_web_stomp

#expose the rabbitmq web management UI to the host
#EXPOSE 15672:15672
#expose the rabbitmq stomp interface
EXPOSE 15674:15674
